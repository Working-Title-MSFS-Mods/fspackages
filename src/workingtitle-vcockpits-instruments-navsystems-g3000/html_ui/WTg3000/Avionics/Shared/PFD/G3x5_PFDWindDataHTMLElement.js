class WT_G3x5_PFDWindDataModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_G3x5_PFDWindModeSetting} modeSetting
     */
    constructor(airplane, modeSetting, unitsController) {
        this._airplane = airplane;
        this._modeSetting = modeSetting;


        this._settingMode;
        this._mode = WT_G3x5_PFDWindDataModel.Mode.NO_DATA;
        this._windSpeedModel = new WT_NumberUnitModelSimVar(WT_Unit.KNOT, "AMBIENT WIND VELOCITY", "knots");
        this._windDirectionModel = new WT_NavAngleModelSimVar(false, {
            updateLocation(location) {
                airplane.navigation.position(location);
            }
        }, "AMBIENT WIND DIRECTION", "degree", false);
        this._windSpeed;
        this._windDirection;
        this._windDirectionRelative = 0;

        this._initModeListener();
        this._updateSettingMode();
        this._initUnitsControllerAdapter(unitsController);
    }

    _initModeListener() {
        this._modeSetting.addListener(this._onModeSettingChanged.bind(this));
    }

    _initUnitsControllerAdapter(unitsSettingModel) {
        this._unitsControllerAdapter = new WT_G3x5_UnitsSettingModelPFDWindDataModelAdapter(unitsSettingModel, this);
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDWindDataModel.Mode}
     */
    get mode() {
        return this._mode;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get windSpeed() {
        return this._windSpeed;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get windSpeedUnit() {
        return this._windSpeedModel.getUnit();
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get windDirection() {
        return this._windDirection;
    }

    /**
     * @readonly
     * @type {WT_NavAngleUnit}
     */
    get windDirectionUnit() {
        return this._windDirectionModel.getUnit();
    }

    /**
     * @readonly
     * @type {Number}
     */
    get windDirectionRelative() {
        return this._windDirectionRelative;
    }

    /**
     *
     * @param {WT_Unit} unit
     */
    setWindSpeedUnit(unit) {
        this._windSpeedModel.setUnit(unit);
    }

    /**
     *
     * @param {WT_NavAngleUnit} unit
     */
    setWindDirectionUnit(unit) {
        this._windDirectionModel.setUnit(unit);
    }

    _updateSettingMode() {
        this._settingMode = this._modeSetting.getValue();
    }

    _onModeSettingChanged(setting, newValue, oldValue) {
        this._updateSettingMode();
    }

    _updateWindSpeed() {
        this._windSpeed = this._windSpeedModel.getValue();
    }

    _updateWindDirection() {
        this._windDirection = this._windDirectionModel.getValue();
        let relativeDirection = this.windDirection.number - this._airplane.navigation.headingTrue();
        this._windDirectionRelative = (relativeDirection + 360) % 360;
    }

    _updateMode() {
        if (this._airplane.sensors.isOnGround()) {
            this._mode = WT_G3x5_PFDWindDataModel.Mode.NO_DATA;
        } else {
            switch (this._settingMode) {
                case WT_G3x5_PFDWindModeSetting.Mode.OPTION_1:
                    this._mode = WT_G3x5_PFDWindDataModel.Mode.OPTION_1;
                    break;
                case WT_G3x5_PFDWindModeSetting.Mode.OPTION_2:
                    this._mode = WT_G3x5_PFDWindDataModel.Mode.OPTION_2;
                    break;
                case WT_G3x5_PFDWindModeSetting.Mode.OPTION_3:
                    this._mode = WT_G3x5_PFDWindDataModel.Mode.OPTION_3;
                    break;
                default:
                    this._mode = WT_G3x5_PFDWindDataModel.Mode.OFF;
            }
        }
    }

    update() {
        this._updateWindSpeed();
        this._updateWindDirection();
        this._updateMode();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_PFDWindDataModel.Mode = {
    OFF: 0,
    OPTION_1: 1,
    OPTION_2: 2,
    OPTION_3: 3,
    NO_DATA: 4
};

class WT_G3x5_UnitsSettingModelPFDWindDataModelAdapter extends WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     * @param {WT_G3x5_PFDWindDataModel} windDataModel
     */
     constructor(unitsSettingModel, windDataModel) {
        super(unitsSettingModel);

        this._windDataModel = windDataModel;
        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDWindDataModel}
     */
    get windDataModel() {
        return this._windDataModel;
    }

    _updateBearing() {
        let unit = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
        this.windDataModel.setWindDirectionUnit(unit);
    }

    _updateSpeed() {
        let unit = this.unitsSettingModel.distanceSpeedSetting.getSpeedUnit();
        this.windDataModel.setWindSpeedUnit(unit);
    }
}

class WT_G3x5_PFDWindDataHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{model:WT_G3x5_PFDWindDataModel}}
         */
        this._context = null;
        this._isInit = false;

        this._initFormatters();
    }

    _getTemplate() {
        return WT_G3x5_PFDWindDataHTMLElement.TEMPLATE;
    }

    _initFormatters() {
        this._initSpeedFormatter();
        this._initBearingFormatter();
    }

    _initSpeedFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false,
            unitCaps: true
        });
        this._speedFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                _numberClassList: [],
                _unitClassList: [WT_G3x5_PFDWindDataHTMLElement.UNIT_CLASS],

                getNumberClassList(numberUnit, forceUnit) {
                    return this._numberClassList;
                },
                getUnitClassList(numberUnit, forceUnit) {
                    return this._unitClassList;
                }
            },
            numberUnitDelim: ""
        });
    }

    _initBearingFormatter() {
        this._bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._arrow = new WT_CachedElement(this.shadowRoot.querySelector(`#arrow`));
        this._option1ArrowHorizontal = new WT_CachedElement(this.shadowRoot.querySelector(`#arrowhorizontal`));
        this._option1ArrowVertical = new WT_CachedElement(this.shadowRoot.querySelector(`#arrowvertical`));
        this._option1Headwind = new WT_CachedElement(this.shadowRoot.querySelector(`#headwind`));
        this._option1Crosswind = new WT_CachedElement(this.shadowRoot.querySelector(`#crosswind`));
        this._option1Speed = new WT_CachedElement(this.shadowRoot.querySelector(`#speedonly`));
        this._option2Speed = new WT_CachedElement(this.shadowRoot.querySelector(`#speedonly`));
        this._option3Speed = new WT_CachedElement(this.shadowRoot.querySelector(`#speed`));
        this._option3Direction = new WT_CachedElement(this.shadowRoot.querySelector(`#direction`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {{model:WT_G3x5_PFDWindDataModel}} context
     */
    setContext(context) {
        this._context = context;
    }

    _setMode(mode) {
        this._wrapper.setAttribute("mode", WT_G3x5_PFDWindDataHTMLElement.MODE_ATTRIBUTES[mode]);
    }

    _updateMode() {
        this._setMode(this._context.model.mode);
    }

    _calculateHeadwind(speedKnots, relativeDirection) {
        return speedKnots * Math.cos(relativeDirection * Avionics.Utils.DEG2RAD);
    }

    _calculateCrosswind(speedKnots, relativeDirection) {
        return speedKnots * Math.sin(relativeDirection * Avionics.Utils.DEG2RAD);
    }

    /**
     *
     * @param {WT_NumberUnit} speed
     * @param {Number} relativeDirection
     */
    _setOption1Speed(speed, relativeDirection) {
        let speedKnots = speed.asUnit(WT_Unit.KNOT);
        let headwind = this._calculateHeadwind(speedKnots, relativeDirection);
        let crosswind = this._calculateCrosswind(speedKnots, relativeDirection);

        let directionMinimumKnots = WT_G3x5_PFDWindDataHTMLElement.DIRECTION_MINIMUM_SPEED.asUnit(WT_Unit.KNOT);
        headwind = Math.abs(headwind) > directionMinimumKnots ? headwind : 0;
        crosswind = Math.abs(crosswind) > directionMinimumKnots ? crosswind : 0;

        this._option1Headwind.textContent = Math.abs(headwind).toFixed(0);
        this._option1Crosswind.textContent = Math.abs(crosswind).toFixed(0);

        this._option1ArrowVertical.setAttribute("style", `transform: rotate(${headwind >= 0 ? 0 : 180}deg);`);
        this._option1ArrowHorizontal.setAttribute("style", `transform: rotate(${crosswind >= 0 ? 0 : 180}deg);`);
    }

    /**
     *
     * @param {WT_NumberUnit} speed
     */
    _setOption2Speed(speed) {
        this._option2Speed.textContent = speed.asUnit(WT_Unit.KNOT).toFixed(0);
    }

    /**
     *
     * @param {WT_NumberUnit} speed
     * @param {WT_Unit} unit
     */
    _setOption3Speed(speed, unit) {
        this._option3Speed.innerHTML = this._speedFormatter.getFormattedHTML(speed, unit);
    }

    _updateWindSpeed() {
        switch (this._context.model.mode) {
            case WT_G3x5_PFDWindDataModel.Mode.OPTION_1:
                this._setOption1Speed(this._context.model.windSpeed, this._context.model.windDirectionRelative);
                break;
            case WT_G3x5_PFDWindDataModel.Mode.OPTION_2:
                this._setOption2Speed(this._context.model.windSpeed);
                break;
            case WT_G3x5_PFDWindDataModel.Mode.OPTION_3:
                this._setOption3Speed(this._context.model.windSpeed, this._context.model.windSpeedUnit);
                break;
        }
    }

    _showWindDirection(value) {
        this._wrapper.setAttribute("show-direction", `${value}`);
    }

    _setArrowDirection(relativeDirection) {
        this._arrow.setAttribute("style", `transform: rotate(${relativeDirection}deg);`);
    }

    _setOption3Direction(direction, unit) {
        this._option3Direction.innerHTML = this._bearingFormatter.getFormattedString(direction, unit);
    }

    _updateWindDirection() {
        if (this._context.model.windSpeed.compare(WT_G3x5_PFDWindDataHTMLElement.DIRECTION_MINIMUM_SPEED) < 0) {
            this._showWindDirection(false);
        } else {
            switch (this._context.model.mode) {
                case WT_G3x5_PFDWindDataModel.Mode.OPTION_3:
                    this._setOption3Direction(this._context.model.windDirection, this._context.model.windDirectionUnit);
                case WT_G3x5_PFDWindDataModel.Mode.OPTION_2:
                    this._setArrowDirection(this._context.model.windDirectionRelative);
                    break;
            }
            this._showWindDirection(true);
        }
    }

    _updateDisplay() {
        this._updateMode();
        this._updateWindSpeed();
        this._updateWindDirection();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDWindDataHTMLElement.DIRECTION_MINIMUM_SPEED = WT_Unit.KNOT.createNumber(1);
WT_G3x5_PFDWindDataHTMLElement.MODE_ATTRIBUTES = [
    "off",
    "option1",
    "option2",
    "option3",
    "nodata"
];
WT_G3x5_PFDWindDataHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_PFDWindDataHTMLElement.NAME = "wt-pfd-winddata";
WT_G3x5_PFDWindDataHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDWindDataHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            color: white;
        }
            .mode {
                display: none;
            }
            #wrapper[mode="option1"] .option1 {
                display: block;
            }
            #wrapper[mode="option2"] .option2 {
                display: block;
            }
            #wrapper[mode="option3"] .option3 {
                display: block;
            }
            #wrapper[mode="nodata"] .nodata {
                display: block;
            }
            .direction {
                display: none;
            }
            #wrapper[show-direction="true"] .direction {
                display: block;
            }
            .arrow {
                stroke-width: 1;
                stroke: black;
                fill: white;
            }

            #crosscontainer {
                position: relative;
                width: 100%;
                height: 100%;
                font-size: var(--winddata-option1-font-size, 1em);
            }
                #crossarrows {
                    position: absolute;
                    left: 33%;
                    top: 30%;
                    width: 1.5em;
                    height: 1.5em;
                    transform: translate(-50%, -50%);
                }
                    #arrowhorizontal,
                    #arrowvertical {
                        position: absolute;
                        left: 0%;
                        top: 0%;
                        width: 100%;
                        height: 100%;
                    }
                #crosswind {
                    position: absolute;
                    left: calc(33% + 0.75em + 0.2em);
                    top: 30%;
                    transform: translateY(-50%);
                }
                #headwind {
                    position: absolute;
                    left: 33%;
                    top: calc(30% + 0.75em);
                    transform: translateX(-50%);
                }
            #arrowcontainer {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 40%;
                height: 100%;
            }
                #arrow {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 100%;
                }
            #speedcontainer {
                position: absolute;
                right: 0%;
                top: 0%;
                width: 55%;
                height: 100%;
            }
                #speedonly {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    transform: translateY(-50%);
                    text-align: left;
                    font-size: var(--winddata-option2-font-size, 1em);
                }
            #speeddirectioncontainer {
                position: absolute;
                right: 0%;
                top: 0%;
                width: 55%;
                height: 100%;
                text-align: left;
                font-size: var(--winddata-option3-font-size, 0.9em);
            }
                #direction {
                    position: absolute;
                    left: 0%;
                    bottom: 50%;
                }
                #speed {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                }
                    #speed .${WT_G3x5_PFDWindDataHTMLElement.UNIT_CLASS} {
                        font-size: calc(var(--winddata-unit-font-size-factor, 0.75) * var(--winddata-option3-font-size, 0.9em));
                    }
            #nodatacontainer {
                position: relative;
                width: 100%;
                height: 100%;
            }
                #nodata {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    width: 100%;
                    transform: translateY(-50%);
                    text-align: center;
                    font-size: var(--winddata-nodata-font-size, 1em);
                }
    </style>
    <div id="wrapper">
        <div id="crosscontainer" class="mode option1">
            <div id="crossarrows">
                <svg id="arrowhorizontal" class="arrow" viewBox="0 0 100 100">
                    <rect x="25" y="45" width="70" height="10" />
                    <path d="M 25 30 L 25 70 L 5 50 Z" />
                </svg>
                <svg id="arrowvertical" class="arrow" viewBox="0 0 100 100">
                    <rect x="45" y="5" width="10" height="70" />
                    <path d="M 30 75 L 70 75 L 50 95 Z" />
                </svg>
            </div>
            <div id="crosswind"></div>
            <div id="headwind"></div>
        </div>
        <div id="arrowcontainer" class="mode option2 option3">
            <svg id="arrow" class="direction arrow" viewBox="0 0 100 100">
                <rect x="45" y="5" width="10" height="65" />
                <path d="M 30 70 L 70 70 L 50 95 Z" />
            </svg>
        </div>
        <div id="speedcontainer" class="mode option2">
            <div id="speedonly"></div>
        </div>
        <div id="speeddirectioncontainer" class="mode option3">
            <div id="direction" class="direction"></div>
            <div id="speed"></div>
        </div>
        <div id="nodatacontainer" class="mode nodata">
            <div id="nodata">NO WIND<br>DATA</div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDWindDataHTMLElement.NAME, WT_G3x5_PFDWindDataHTMLElement);