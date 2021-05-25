class WT_G3x5_PFDAutopilotDisplay extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @type {WT_G3x5_PFDAutopilotDisplayHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     *
     * @returns {WT_G3x5_PFDAutopilotDisplayModel}
     */
     _createModel() {
    }

    _createHTMLElement() {
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

    onEvent(event) {
        switch (event) {
            case "Autopilot_Disc":
                this._model.onAutopilotDisconnected();
                break;
            case "Autopilot_Manual_Off":
                this._model.onAutopilotManualDisengaged();
                break;
        }
    }
}

class WT_G3x5_PFDAutopilotDisplayModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        this._airplane = airplane;
        this._autopilot = airplane.autopilot;

        this._lastMasterActive = false;
        this._masterState = WT_G3x5_PFDAutopilotDisplayModel.MasterState.OFF;
        this._isFlightDirectorActive = false;
        this._navSource = WT_AirplaneAutopilot.NavSource.FMS;
        this._isApproachActive = false;
        this._isApproachCaptured = false;
        this._lateralModeActive = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.NONE;
        this._lateralModeArmed = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.NONE;
        this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.NONE;
        this._verticalModeArmedPrimary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.NONE;
        this._verticalModeArmedSecondary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.NONE;

        this._selectedAltitude = WT_Unit.FOOT.createNumber(0);
        this._isSpeedReferenceMach = false;

        this._referenceAltitude = WT_Unit.FOOT.createNumber(0);
        this._referenceVerticalSpeed = WT_Unit.FPM.createNumber(0);
        this._referenceAirspeed = WT_Unit.KNOT.createNumber(0);
        this._referenceMach = 0;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAutopilotDisplayModel.MasterState}
     */
    get masterState() {
        return this._masterState;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isFlightDirectorActive() {
        return this._isFlightDirectorActive;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAutopilotDisplayModel.LateralMode}
     */
    get lateralModeActive() {
        return this._lateralModeActive;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAutopilotDisplayModel.LateralMode}
     */
    get lateralModeArmed() {
        return this._lateralModeArmed;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAutopilotDisplayModel.VerticalMode}
     */
    get verticalModeActive() {
        return this._verticalModeActive;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAutopilotDisplayModel.VerticalMode}
     */
    get verticalModeArmedPrimary() {
        return this._verticalModeArmedPrimary;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAutopilotDisplayModel.VerticalMode}
     */
    get verticalModeArmedSecondary() {
        return this._verticalModeArmedSecondary;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get selectedAltitude() {
        return this._selectedAltitude.readonly();
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isSpeedReferenceMach() {
        return this._isSpeedReferenceMach;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get referenceAltitude() {
        return this._referenceAltitude.readonly();
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get referenceVerticalSpeed() {
        return this._referenceVerticalSpeed.readonly();
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get referenceAirspeed() {
        return this._referenceAirspeed.readonly();
    }

    /**
     * @readonly
     * @type {Number}
     */
    get referenceMach() {
        return this._referenceMach;
    }

    onAutopilotManualDisengaged() {
        this._masterState = WT_G3x5_PFDAutopilotDisplayModel.MasterState.OFF_MANUAL_DISCONNECT;
    }

    onAutopilotDisconnected() {
        if (this._masterState === WT_G3x5_PFDAutopilotDisplayModel.MasterState.ON) {
            this._masterState = WT_G3x5_PFDAutopilotDisplayModel.MasterState.OFF_MANUAL_DISCONNECT;
        } else {
            this._masterState = WT_G3x5_PFDAutopilotDisplayModel.MasterState.OFF;
        }
    }

    _updateMasterState() {
        if (this._autopilot.isMasterActive()) {
            this._masterState = WT_G3x5_PFDAutopilotDisplayModel.MasterState.ON;
            this._lastMasterActive = true;
        } else {
            if (this._lastMasterActive && this.masterState === WT_G3x5_PFDAutopilotDisplayModel.MasterState.ON) {
                this._masterState = WT_G3x5_PFDAutopilotDisplayModel.MasterState.OFF_AUTO_DISCONNECT;
            }
            this._lastMasterActive = false;
        }
    }

    _updateFlightDirector() {
        this._isFlightDirectorActive = this._autopilot.flightDirector.isActive();
    }

    _updateNavSource() {
        this._navSource = this._autopilot.navigationSource();
    }

    _updateApproachMode() {
        this._isApproachActive = this._autopilot.isApproachActive();
        this._isApproachCaptured = this._autopilot.isApproachCaptured();
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} navSlot
     */
    _getLateralModeFromNav(navSlot) {
        if (navSlot.hasLOC() && navSlot.isReceiving()) {
            return WT_G3x5_PFDAutopilotDisplayModel.LateralMode.LOC;
        } else {
            if (this._isApproachCaptured) {
                return WT_G3x5_PFDAutopilotDisplayModel.LateralMode.VAPP;
            } else {
                return WT_G3x5_PFDAutopilotDisplayModel.LateralMode.VOR;
            }
        }
    }

    _updateActiveLateralMode() {
        if (this._autopilot.isWingLevelerActive()) {
            this._lateralModeActive = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.LEVEL;
        } else if (this._autopilot.isBankHoldActive()) {
            this._lateralModeActive = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.ROLL;
        } else if (this._autopilot.isHeadingHoldActive()) {
            this._lateralModeActive = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.HEADING;
        } else if (this._autopilot.isBackCourseActive()) {
            this._lateralModeActive = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.BC;
        } else if (this._autopilot.isNAVActive()) {
            switch (this._navSource) {
                case WT_AirplaneAutopilot.NavSource.FMS:
                    this._lateralModeActive = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.FMS;
                    break;
                case WT_AirplaneAutopilot.NavSource.NAV1:
                    this._lateralModeActive = this._getLateralModeFromNav(this._airplane.navCom.getNav(1));
                    break;
                case WT_AirplaneAutopilot.NavSource.NAV2:
                    this._lateralModeActive = this._getLateralModeFromNav(this._airplane.navCom.getNav(2));
                    break;
            }
        } else {
            this._lateralModeActive = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.NONE;
        }
    }

    _updateArmedLateralMode() {
        if (this._autopilot.isBackCourseArmed()) {
            this._lateralModeArmed = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.BC;
            return;
        } else if (this._autopilot.isNAVArmed()) {
            switch (this._navSource) {
                case WT_AirplaneAutopilot.NavSource.FMS:
                    this._lateralModeArmed = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.FMS;
                    return;
                case WT_AirplaneAutopilot.NavSource.NAV1:
                    this._lateralModeArmed = this._getLateralModeFromNav(this._airplane.navCom.getNav(1));
                    return;
                case WT_AirplaneAutopilot.NavSource.NAV2:
                    this._lateralModeArmed = this._getLateralModeFromNav(this._airplane.navCom.getNav(2));
                    return;
            }
        }

        this._lateralModeArmed = WT_G3x5_PFDAutopilotDisplayModel.LateralMode.NONE;
    }

    _updateLateralMode() {
        this._updateActiveLateralMode();
        this._updateArmedLateralMode();
    }

    _updateActiveVerticalMode() {
        if (this._autopilot.isWingLevelerActive()) {
            this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.LEVEL;
        } else if (this._autopilot.isPitchHoldActive()) {
            this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.PITCH;
        } else if (this._autopilot.isAltHoldActive()) {
            this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.ALT_HOLD;
        } else if (this._autopilot.isVSActive()) {
            this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.VS;
        } else if (this._autopilot.isFLCActive()) {
            this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.FLC;
        } else if (this._autopilot.isGSCaptured()) {
            if (this._navSource === WT_AirplaneAutopilot.NavSource.FMS) {
                this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.GP;
            } else {
                this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.GS;
            }
        } else {
            this._verticalModeActive = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.NONE;
        }
    }

    _updatePrimaryArmedVerticalMode() {
        if (this.verticalModeActive === WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.VS ||
            this.verticalModeActive === WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.FLC) {

            this._verticalModeArmedPrimary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.ALT_CAPTURE;
        } else {
            this._verticalModeArmedPrimary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.NONE;
        }
    }

    _updateSecondaryArmedVerticalMode() {
        if (this._autopilot.isGSArmed()) {
            if (this._navSource === WT_AirplaneAutopilot.NavSource.FMS) {
                switch (this._airplane.fms.approachType()) {
                    case WT_AirplaneFMS.ApproachType.ILS:
                        this._verticalModeArmedSecondary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.GS;
                        break;
                    case WT_AirplaneFMS.ApproachType.RNAV:
                        this._verticalModeArmedSecondary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.GP;
                        break;
                    default:
                        this._verticalModeArmedSecondary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.NONE;
                }
            } else {
                this._verticalModeArmedSecondary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.GS;
            }
        } else {
            this._verticalModeArmedSecondary = WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.NONE;
        }
    }

    _updateArmedVerticalModes() {
        this._updatePrimaryArmedVerticalMode();
        this._updateSecondaryArmedVerticalMode();
    }

    _updateVerticalMode() {
        this._updateActiveVerticalMode();
        this._updateArmedVerticalModes();
    }

    _updateSpeedMode() {
        this._isSpeedReferenceMach = this._autopilot.isSpeedReferenceMach();
    }

    _updateSelectedAltitude() {
        this._autopilot.selectedAltitude(this._selectedAltitude);
    }

    _updateReferenceAltitude() {
        this._autopilot.referenceAltitude(this._referenceAltitude);
    }

    _updateReferenceVerticalSpeed() {
        this._autopilot.referenceVS(this._referenceVerticalSpeed);
    }

    _updateReferenceAirspeed() {
        this._autopilot.referenceAirspeed(this._referenceAirspeed);
    }

    _updateReferenceMach() {
        this._referenceMach = this._autopilot.referenceMach();
    }

    update() {
        this._updateMasterState();
        this._updateFlightDirector();
        this._updateNavSource();
        this._updateApproachMode();
        this._updateLateralMode();
        this._updateVerticalMode();
        this._updateSpeedMode();
        this._updateSelectedAltitude();
        this._updateReferenceAltitude();
        this._updateReferenceVerticalSpeed();
        this._updateReferenceAirspeed();
        this._updateReferenceMach();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_PFDAutopilotDisplayModel.MasterState = {
    OFF: 0,
    OFF_MANUAL_DISCONNECT: 1,
    OFF_AUTO_DISCONNECT: 2,
    ON: 3
};
/**
 * @enum {Number}
 */
WT_G3x5_PFDAutopilotDisplayModel.LateralMode = {
    NONE: 0,
    LEVEL: 1,
    ROLL: 2,
    HEADING: 3,
    FMS: 4,
    VOR: 5,
    LOC: 6,
    VAPP: 7,
    BC: 8
};
/**
 * @enum {Number}
 */
WT_G3x5_PFDAutopilotDisplayModel.VerticalMode = {
    NONE: 0,
    LEVEL: 1,
    PITCH: 2,
    ALT_CAPTURE: 3,
    ALT_HOLD: 4,
    VS: 5,
    FLC: 6,
    GS: 7,
    GP: 8
};

class WT_G3x5_PFDAutopilotDisplayHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{model:WT_G3x5_PFDAutopilotDisplayModel}}
         */
        this._context = null;
        this._isInit = false;

        this._initFormatters();

        this._lastReferenceAltitude = WT_Unit.FOOT.createNumber(0);
        this._isAltitudeHoldAlertArmed = false;
        this._isAltitudeHoldAlertActivated = false;
    }

    _getTemplate() {
    }

    _initAltitudeFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
        this._altitudeFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_PFDAutopilotDisplayHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _initVerticalSpeedFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
        this._verticalSpeedFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_PFDAutopilotDisplayHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _initAirspeedFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
        this._airspeedFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_PFDAutopilotDisplayHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _initFormatters() {
        this._initAltitudeFormatter();
        this._initVerticalSpeedFormatter();
        this._initAirspeedFormatter();
    }

    _defineChildren() {
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {{model:WT_G3x5_PFDAutopilotDisplayModel}} context
     */
     setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
    }

    _setMasterShow(value) {
    }

    _updateMaster() {
        this._setMasterShow(this._context.model.masterState === WT_G3x5_PFDAutopilotDisplayModel.MasterState.ON);
    }

    _setFlightDirectorShow(value) {
    }

    _updateFlightDirector() {
        this._setFlightDirectorShow(this._context.model.isFlightDirectorActive);
    }

    _setLateralActiveText(text) {
    }

    _updateLateralActive() {
        this._setLateralActiveText(WT_G3x5_PFDAutopilotDisplayHTMLElement.LATERAL_MODE_TEXTS[this._context.model.lateralModeActive]);
    }

    _setLateralArmedText(text) {
    }

    _updateLateralArmed() {
        this._setLateralArmedText(WT_G3x5_PFDAutopilotDisplayHTMLElement.LATERAL_MODE_TEXTS[this._context.model.lateralModeArmed]);
    }

    _setVerticalActiveText(text) {
    }

    _updateVerticalActive() {
        this._setVerticalActiveText(WT_G3x5_PFDAutopilotDisplayHTMLElement.VERTICAL_MODE_TEXTS[this._context.model.verticalModeActive]);
    }

    _setVerticalArmedPrimaryText(text) {
    }

    _updateVerticalArmedPrimary() {
        this._setVerticalArmedPrimaryText(WT_G3x5_PFDAutopilotDisplayHTMLElement.VERTICAL_MODE_TEXTS[this._context.model.verticalModeArmedPrimary]);
    }

    _setVerticalArmedSecondaryText(text) {
    }

    _updateVerticalArmedSecondary() {
        this._setVerticalArmedSecondaryText(WT_G3x5_PFDAutopilotDisplayHTMLElement.VERTICAL_MODE_TEXTS[this._context.model.verticalModeArmedSecondary]);
    }

    _setVerticalReferenceHTML(html) {
    }

    _updateVerticalReference() {
        let verticalModeActive = this._context.model.verticalModeActive;
        switch (verticalModeActive) {
            case WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.ALT_HOLD:
            case WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.ALT_CAPTURE:
                this._setVerticalReferenceHTML(this._altitudeFormatter.getFormattedHTML(this._context.model.referenceAltitude));
                break;
            case WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.VS:
                this._setVerticalReferenceHTML(this._verticalSpeedFormatter.getFormattedHTML(this._context.model.referenceVerticalSpeed));
                break;
            case WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.FLC:
                if (this._context.model.isSpeedReferenceMach) {
                    this._setVerticalReferenceHTML(`M ${this._context.model.referenceMach.toFixed(3).replace(/^0\./, ".")}`);
                } else {
                    this._setVerticalReferenceHTML(this._airspeedFormatter.getFormattedHTML(this._context.model.referenceAirspeed));
                }
                break;
            default:
                this._setVerticalReferenceHTML("");
        }
    }

    _setMasterDisconnectAlertState(state) {
    }

    _updateMasterDisconnectAlert() {
        let alertState;
        switch (this._context.model.masterState) {
            case WT_G3x5_PFDAutopilotDisplayModel.MasterState.OFF_MANUAL_DISCONNECT:
                alertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.CAUTION;
                break;
            case WT_G3x5_PFDAutopilotDisplayModel.MasterState.OFF_AUTO_DISCONNECT:
                alertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.WARNING;
                break;
            default:
                alertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.OFF;
        }
        this._setMasterDisconnectAlertState(alertState);
    }

    _setAltitudeHoldAlert(value) {
    }

    _updateAltitudeHoldAlert() {
        let isAlertActivated = false;
        let isAlertArmed = this._isAltitudeHoldAlertArmed;
        this._isAltitudeHoldAlertArmed = this._context.model.verticalModeArmedPrimary === WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.ALT_CAPTURE;

        if (this._context.model.verticalModeActive === WT_G3x5_PFDAutopilotDisplayModel.VerticalMode.ALT_HOLD) {
            let selectedAltitude = this._context.model.selectedAltitude;
            let referenceAltitude = this._context.model.referenceAltitude;
            isAlertActivated = (this._isAltitudeHoldAlertActivated && referenceAltitude.equals(this._lastReferenceAltitude)) || (isAlertArmed && referenceAltitude.equals(selectedAltitude));
        }

        this._setAltitudeHoldAlert(isAlertActivated);
        this._isAltitudeHoldAlertActivated = isAlertActivated;
        this._lastReferenceAltitude.set(this._context.model.referenceAltitude);
    }

    _updateAlerts() {
        this._updateMasterDisconnectAlert();
        this._updateAltitudeHoldAlert();
    }

    _updateDisplay() {
        this._updateMaster();
        this._updateFlightDirector();
        this._updateLateralActive();
        this._updateLateralArmed();
        this._updateVerticalActive();
        this._updateVerticalArmedPrimary();
        this._updateVerticalArmedSecondary();
        this._updateVerticalReference();
        this._updateAlerts();
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._updateDisplay();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState = {
    OFF: 0,
    CAUTION: 1,
    WARNING: 2
}
WT_G3x5_PFDAutopilotDisplayHTMLElement.LATERAL_MODE_TEXTS = [
    "",
    "LVL",
    "ROL",
    "HDG",
    "FMS",
    "VOR",
    "LOC",
    "VAPP",
    "BC"
];
WT_G3x5_PFDAutopilotDisplayHTMLElement.VERTICAL_MODE_TEXTS = [
    "",
    "LVL",
    "PIT",
    "ALTS",
    "ALT",
    "VS",
    "FLC",
    "GS",
    "GP"
];
WT_G3x5_PFDAutopilotDisplayHTMLElement.UNIT_CLASS = "unit";