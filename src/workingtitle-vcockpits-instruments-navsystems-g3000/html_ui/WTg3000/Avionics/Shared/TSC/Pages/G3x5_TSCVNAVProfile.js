class WT_G3x5_TSCVNAVProfile extends WT_G3x5_TSCPageElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCDirectToHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _getTitle() {
        return WT_G3x5_TSCVNAVProfile.TITLE;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCVNAVProfileHTMLElement();
        htmlElement.setParentPage(this);
        return htmlElement;
    }

    _initFromHTMLElement() {
        this.htmlElement.addListener(this._onHTMLElementEvent.bind(this));
    }

    init(root) {
        this.container.title = this._getTitle();

        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    _toggleVNAVEnabled() {
        this.instrument.flightPlanManagerWT.setVNAVEnabled(!this.instrument.flightPlanManagerWT.isVNAVEnabled);
    }

    _setVSTarget(vsTarget) {
        this.instrument.flightPlanManagerWT.setActiveVNAVVSTarget(vsTarget);
    }

    _setFPA(fpa) {
        this.instrument.flightPlanManagerWT.setActiveVNAVFPA(fpa);
    }

    _activateVNAVDRCT() {
        try {
            if (this.instrument.flightPlanManagerWT.directTo.isVNAVActive()) {
                this.instrument.flightPlanManagerWT.activateVNAVDirectTo();
            } else {
                let activeRestrictionLeg = this.instrument.flightPlanManagerWT.getActiveVNAVLegRestriction(true);
                if (activeRestrictionLeg) {
                    this.instrument.flightPlanManagerWT.activateVNAVDirectTo(activeRestrictionLeg.leg);
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCDirectToEvent} event
     */
    _onHTMLElementEvent(event) {
        switch (event.type) {
            case WT_G3x5_TSCVNAVProfileHTMLElement.EventType.VNAV_ENABLED_TOGGLED:
                this._toggleVNAVEnabled();
                break;
            case WT_G3x5_TSCVNAVProfileHTMLElement.EventType.VS_TARGET_SELECTED:
                this._setVSTarget(event.vsTarget);
                break;
            case WT_G3x5_TSCVNAVProfileHTMLElement.EventType.FPA_SELECTED:
                this._setFPA(event.fpa);
                break;
            case WT_G3x5_TSCVNAVProfileHTMLElement.EventType.VNAV_DRCT_ACTIVATED:
                this._activateVNAVDRCT();
                break;
        }
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}
WT_G3x5_TSCVNAVProfile.TITLE = "VNAV Profile";

class WT_G3x5_TSCVNAVProfileHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((event:WT_G3x5_TSCVNAVProfileEvent) => void)[]}
         */
        this._listeners = [];

        /**
         * @type {WT_G3x5_TSCVNAVProfile}
         */
        this._parentPage = null;
        this._isInit = false;

        this._initFormatters();

        this._tempFoot1 = WT_Unit.FOOT.createNumber(0);
        this._tempFoot2 = WT_Unit.FOOT.createNumber(0);
        this._tempFoot3 = WT_Unit.FOOT.createNumber(0);
        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempKnot = WT_Unit.KNOT.createNumber(0);
        this._tempFPM = WT_Unit.FPM.createNumber(0);
        this._tempSecond1 = WT_Unit.SECOND.createNumber(0);
        this._tempSecond2 = WT_Unit.SECOND.createNumber(0);
    }

    _getTemplate() {
        return WT_G3x5_TSCVNAVProfileHTMLElement.TEMPLATE;
    }

    _initDurationFormatter() {
        this._durationFormatter = new WT_TimeFormatter({
            pad: 1,
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        });
    }

    _initAltitudeFormatter() {
        this._altitudeFormatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
    }

    _initVerticalSpeedFormatter() {
        this._verticalSpeedFormatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
    }

    _initFormatters() {
        this._initDurationFormatter();
        this._initAltitudeFormatter();
        this._initVerticalSpeedFormatter();
    }

    async _defineChildren() {
        [
            this._vnavEnableButton,
            this._vsTargetButton,
            this._fpaButton,
            this._vnavDRCTButton
        ] = (await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, "#enable", WT_TSCStatusBarButton),
            WT_CustomElementSelector.select(this.shadowRoot, "#vstarget", WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, "#fpa", WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, "#vnavdrct", WT_TSCContentButton)
        ])).map(button => new WT_CachedElement(button));

        this._waypointIdent = new WT_CachedElement(this.shadowRoot.querySelector("#waypointident"), {cacheAttributes: false});
        this._waypointAltitudeNumber = new WT_CachedElement(this.shadowRoot.querySelector("#waypointaltitudenumber"), {cacheAttributes: false});
        this._waypointAltitudeUnit = new WT_CachedElement(this.shadowRoot.querySelector("#waypointaltitudeunit"), {cacheAttributes: false});

        this._timeToTitle = new WT_CachedElement(this.shadowRoot.querySelector("#timeto .bottomTitle"), {cacheAttributes: false});
        this._timeToValue = new WT_CachedElement(this.shadowRoot.querySelector("#timeto .bottomValue"), {cacheAttributes: false});
        this._vsRequiredNumber = new WT_CachedElement(this.shadowRoot.querySelector("#vsrequired .bottomValue .number"), {cacheAttributes: false});
        this._vsRequiredUnit = new WT_CachedElement(this.shadowRoot.querySelector("#vsrequired .bottomValue .unit"), {cacheAttributes: false});
        this._vertDevNumber = new WT_CachedElement(this.shadowRoot.querySelector("#vertdev .bottomValue .number"), {cacheAttributes: false});
        this._vertDevUnit = new WT_CachedElement(this.shadowRoot.querySelector("#vertdev .bottomValue .unit"), {cacheAttributes: false});
    }

    _initButtonListeners() {
        this._vnavEnableButton.element.addButtonListener(this._onVNAVEnableButtonPressed.bind(this));
        this._vsTargetButton.element.addButtonListener(this._onVSTargetButtonPressed.bind(this));
        this._fpaButton.element.addButtonListener(this._onFPAButtonPressed.bind(this));
        this._vnavDRCTButton.element.addButtonListener(this._onVNAVDRCTButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initButtonListeners();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_G3x5_TSCVNAVProfile} parentPage
     */
    setParentPage(parentPage) {
        if (!parentPage || this._parentPage) {
            return;
        }

        this._parentPage = parentPage;
    }

    _getActiveVNAVVSTarget(groundSpeed, reference) {
        let activeVNAVPath = this._parentPage.instrument.flightPlanManagerWT.getActiveVNAVPath(true);
        return activeVNAVPath ? activeVNAVPath.getVerticalSpeedTarget(groundSpeed, reference) : null;
    }

    _getActiveVNAVFPA() {
        let activeVNAVPath = this._parentPage.instrument.flightPlanManagerWT.getActiveVNAVPath(true);
        return activeVNAVPath ? activeVNAVPath.getFlightPathAngle() : null;
    }

    _openNumericKeyboard(title, digitCount, decimalPlaces, unit, initialValue, minValue, maxValue, callback) {
        this._parentPage.instrument.numKeyboard.element.setContext({
            homePageGroup: this._parentPage.homePageGroup,
            homePageName: this._parentPage.homePageName,
            title,
            digitCount,
            decimalPlaces,
            positiveOnly: false,
            unit,
            initialValue,
            minValue,
            maxValue,
            valueEnteredCallback: callback
        });
        this._parentPage.instrument.switchToPopUpPage(this._parentPage.instrument.numKeyboard);
    }

    _onVNAVEnableButtonPressed(button) {
        this._notifyListeners(WT_G3x5_TSCVNAVProfileHTMLElement.EventType.VNAV_ENABLED_TOGGLED);
    }

    _onVSTargetSelected(value) {
        this._notifyListeners(WT_G3x5_TSCVNAVProfileHTMLElement.EventType.VS_TARGET_SELECTED, {vsTarget: value});
    }

    _onVSTargetButtonPressed(button) {
        let vsTarget = this._getActiveVNAVVSTarget(this._parentPage.instrument.airplane.navigation.groundSpeed(this._tempKnot), this._tempFPM);
        if (!vsTarget) {
            return;
        }

        this._openNumericKeyboard("Select Vertical Speed Target", 4, 0, this._parentPage.instrument.unitsSettingModel.altitudeSetting.getVerticalSpeedUnit(), vsTarget, WT_G3x5_TSCVNAVProfileHTMLElement.MIN_VS_TARGET, WT_G3x5_TSCVNAVProfileHTMLElement.MAX_VS_TARGET, this._onVSTargetSelected.bind(this));
    }

    _onFPASelected(value) {
        this._notifyListeners(WT_G3x5_TSCVNAVProfileHTMLElement.EventType.FPA_SELECTED, {fpa: value});
    }

    _onFPAButtonPressed(button) {
        let fpa = this._getActiveVNAVFPA();
        if (fpa === null) {
            return;
        }

        this._openNumericKeyboard("Select Flight Path Angle",4, 2, null, fpa, WT_G3x5_TSCVNAVProfileHTMLElement.MIN_FPA, WT_G3x5_TSCVNAVProfileHTMLElement.MAX_FPA, this._onFPASelected.bind(this));
    }

    _onVNAVDRCTButtonPressed(button) {
        this._notifyListeners(WT_G3x5_TSCVNAVProfileHTMLElement.EventType.VNAV_DRCT_ACTIVATED);
    }

    _notifyListeners(eventType, data) {
        let event = {
            source: this,
            type: eventType
        };
        if (data) {
            Object.assign(event, data);
        }
        this._listeners.forEach(listener => listener(event));
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCVNAVProfileEvent) => void} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCVNAVProfileEvent) => void} listener
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    _updateVNAVEnableButton(isVNAVEnabled) {
        this._vnavEnableButton.setAttribute("toggle", isVNAVEnabled ? "on" : "off");
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {WT_Unit} altitudeUnit
     */
    _updateWaypointInfo(activeVNAVPath, altitudeUnit) {
        if (activeVNAVPath) {
            this._waypointIdent.textContent = this._parentPage.instrument.flightPlanManagerWT.getActiveVNAVWaypoint(true).ident;
            this._waypointAltitudeNumber.textContent = this._altitudeFormatter.getFormattedNumber(activeVNAVPath.finalAltitude, altitudeUnit);
            this._waypointAltitudeUnit.textContent = this._altitudeFormatter.getFormattedUnit(activeVNAVPath.finalAltitude, altitudeUnit);
        } else {
            this._waypointIdent.textContent = "_____";
            this._waypointAltitudeNumber.textContent = "_____";
            this._waypointAltitudeUnit.textContent = this._altitudeFormatter.getFormattedUnit(this._tempFoot1, altitudeUnit);
        }
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {WT_NumberUnitObject} timeToTOD
     * @param {WT_NumberUnitObject} apSelectedAltitude
     * @returns {Boolean}
     */
    _canEditActiveVNAVProfile(activeVNAVPath, timeToTOD, apSelectedAltitude) {
        return activeVNAVPath && ((timeToTOD && timeToTOD.compare(WT_G3x5_TSCVNAVProfileHTMLElement.PROFILE_EDIT_TIME_TO_TOD_THRESHOLD) <= 0) || apSelectedAltitude.compare(activeVNAVPath.finalAltitude) < 0);
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {WT_NumberUnitObject} timeToTOD
     * @param {WT_NumberUnitObject} apSelectedAltitude
     * @param {WT_NumberUnitObject} groundSpeed
     * @param {WT_Unit} verticalSpeedUnit
     */
    _updateVSTargetButton(activeVNAVPath, timeToTOD, apSelectedAltitude, groundSpeed, verticalSpeedUnit) {
        this._vsTargetButton.setAttribute("enabled", this._canEditActiveVNAVProfile(activeVNAVPath, timeToTOD, apSelectedAltitude) ? "true" : "false");

        if (activeVNAVPath) {
            let vsTarget = this._getActiveVNAVVSTarget(groundSpeed, this._tempFPM);
            let numberText = this._verticalSpeedFormatter.getFormattedNumber(vsTarget, verticalSpeedUnit);
            let unitText = this._verticalSpeedFormatter.getFormattedUnit(vsTarget, verticalSpeedUnit);
            this._vsTargetButton.setAttribute("valuetext", `${numberText}<span style="font-size: var(--vnavprofile-unit-font-size, 0.75em);">${unitText}</span>`);
        } else {
            let unitText = this._verticalSpeedFormatter.getFormattedUnit(this._tempFPM, verticalSpeedUnit);
            this._vsTargetButton.setAttribute("valuetext", `____<span style="font-size: var(--vnavprofile-unit-font-size, 0.75em);">${unitText}</span>`);
        }
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {WT_NumberUnitObject} timeToTOD
     * @param {WT_NumberUnitObject} apSelectedAltitude
     */
    _updateFPAButton(activeVNAVPath, timeToTOD, apSelectedAltitude) {
        this._fpaButton.setAttribute("enabled", this._canEditActiveVNAVProfile(activeVNAVPath, timeToTOD, apSelectedAltitude) ? "true" : "false");

        if (activeVNAVPath) {
            let fpa = this._getActiveVNAVFPA();
            this._fpaButton.setAttribute("valuetext", `${fpa.toFixed(2)}°`);
        } else {
            this._fpaButton.setAttribute("valuetext", "___°");
        }
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {WT_NumberUnitObject} timeToTOD
     * @param {WT_NumberUnitObject} timeToBOD
     */
    _updateTimeTo(activeVNAVPath, timeToTOD, timeToBOD) {
        if (activeVNAVPath && activeVNAVPath.deltaAltitude.number < 0 && timeToTOD && timeToBOD) {
            if (timeToTOD.number >= 0) {
                this._timeToTitle.innerHTML = "Time to<br>TOD";
                this._timeToValue.textContent = this._durationFormatter.getFormattedString(timeToTOD);
            } else {
                this._timeToTitle.innerHTML = "Time to<br>BOD";
                this._timeToValue.textContent = this._durationFormatter.getFormattedString(timeToBOD);
            }
        } else {
            this._timeToTitle.innerHTML = "Time to<br>BOD";
            this._timeToValue.textContent = "__:__";
        }
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {Boolean} hasReachedTOD
     * @param {WT_NumberUnitObject} distanceRemaining
     * @param {WT_NumberUnitObject} indicatedAltitude
     * @param {WT_NumberUnitObject} groundSpeed
     * @param {WT_Unit} verticalSpeedUnit
     */
    _updateVSRequired(activeVNAVPath, hasReachedTOD, distanceRemaining, indicatedAltitude, groundSpeed, verticalSpeedUnit) {
        if (activeVNAVPath && hasReachedTOD) {
            let vsRequired = activeVNAVPath.getVerticalSpeedRequiredAt(distanceRemaining, indicatedAltitude, groundSpeed, this._tempFPM);
            this._vsRequiredNumber.textContent = this._verticalSpeedFormatter.getFormattedNumber(vsRequired, verticalSpeedUnit);
            this._vsRequiredUnit.textContent = this._verticalSpeedFormatter.getFormattedUnit(vsRequired, verticalSpeedUnit);
        } else {
            this._vsRequiredNumber.textContent = "____";
            this._vsRequiredUnit.textContent = this._verticalSpeedFormatter.getFormattedUnit(this._tempFPM, verticalSpeedUnit);
        }
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {Boolean} hasReachedTOD
     * @param {WT_NumberUnitObject} distanceRemaining
     * @param {WT_NumberUnitObject} indicatedAltitude
     * @param {WT_Unit} altitudeUnit
     */
    _updateVerticalDeviation(activeVNAVPath, hasReachedTOD, distanceRemaining, indicatedAltitude, altitudeUnit) {
        if (activeVNAVPath && hasReachedTOD) {
            let verticalDeviation = activeVNAVPath.getVerticalDeviationAt(distanceRemaining, indicatedAltitude, true, this._tempFoot3);
            this._vertDevNumber.textContent = this._altitudeFormatter.getFormattedNumber(verticalDeviation, altitudeUnit);
            this._vertDevUnit.textContent = this._altitudeFormatter.getFormattedUnit(verticalDeviation, altitudeUnit);
        } else {
            this._vertDevNumber.textContent = "_____";
            this._vertDevUnit.textContent = this._altitudeFormatter.getFormattedUnit(this._tempFoot3, altitudeUnit);
        }
    }

    _updateVNAVDRCTButton(activeVNAVPath) {
        this._vnavDRCTButton.setAttribute("enabled", activeVNAVPath ? "true" : "false");
    }

    _doUpdate() {
        let isVNAVEnabled = this._parentPage.instrument.flightPlanManagerWT.isVNAVEnabled;
        let activeVNAVPath = this._parentPage.instrument.flightPlanManagerWT.getActiveVNAVPath(true);
        let altitudeUnit = this._parentPage.instrument.unitsSettingModel.altitudeSetting.getAltitudeUnit();
        let verticalSpeedUnit = this._parentPage.instrument.unitsSettingModel.altitudeSetting.getVerticalSpeedUnit();

        let groundSpeed;
        let indicatedAltitude;
        let apSelectedAltitude;
        let timeToTOD;
        let timeToBOD;
        let distanceRemaining;
        let hasReachedTOD;
        if (activeVNAVPath) {
            groundSpeed = this._parentPage.instrument.airplane.navigation.groundSpeed(this._tempKnot);
            indicatedAltitude = this._parentPage.instrument.airplane.sensors.getAltimeter(this._parentPage.instrument.flightPlanManagerWT.altimeterIndex).altitudeIndicated(this._tempFoot1);
            apSelectedAltitude = this._parentPage.instrument.airplane.autopilot.selectedAltitude(this._tempFoot2);
            timeToTOD = this._parentPage.instrument.flightPlanManagerWT.timeToActiveVNAVPathStart(true, this._tempSecond1);
            timeToBOD = this._parentPage.instrument.flightPlanManagerWT.timeToActiveVNAVWaypoint(true, this._tempSecond2);
            distanceRemaining = this._parentPage.instrument.flightPlanManagerWT.distanceToActiveVNAVWaypoint(true, this._tempNM);
            hasReachedTOD = activeVNAVPath.deltaAltitude.number === 0 || !(timeToTOD && timeToBOD && timeToTOD.number >= 0);
        }

        this._updateVNAVEnableButton(isVNAVEnabled);
        this._updateWaypointInfo(activeVNAVPath, altitudeUnit);
        this._updateVSTargetButton(activeVNAVPath, timeToTOD, apSelectedAltitude, groundSpeed, verticalSpeedUnit);
        this._updateFPAButton(activeVNAVPath, timeToTOD, apSelectedAltitude);
        this._updateTimeTo(activeVNAVPath, timeToTOD, timeToBOD);
        this._updateVSRequired(activeVNAVPath, hasReachedTOD, distanceRemaining, indicatedAltitude, groundSpeed, verticalSpeedUnit);
        this._updateVerticalDeviation(activeVNAVPath, hasReachedTOD, distanceRemaining, indicatedAltitude, altitudeUnit);
        this._updateVNAVDRCTButton(activeVNAVPath);
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_TSCVNAVProfileHTMLElement.PROFILE_EDIT_TIME_TO_TOD_THRESHOLD = WT_Unit.MINUTE.createNumber(10);
WT_G3x5_TSCVNAVProfileHTMLElement.MIN_VS_TARGET = WT_Unit.FPM.createNumber(-6000);
WT_G3x5_TSCVNAVProfileHTMLElement.MAX_VS_TARGET = WT_Unit.FPM.createNumber(-100);
WT_G3x5_TSCVNAVProfileHTMLElement.MIN_FPA = -6;
WT_G3x5_TSCVNAVProfileHTMLElement.MAX_FPA = -0.1;
/**
 * @enum {Number}
 */
WT_G3x5_TSCVNAVProfileHTMLElement.EventType = {
    VNAV_ENABLED_TOGGLED: 0,
    VS_TARGET_SELECTED: 1,
    FPA_SELECTED: 2,
    VNAV_DRCT_ACTIVATED: 3
};
WT_G3x5_TSCVNAVProfileHTMLElement.NAME = "wt-tsc-vnavprofile";
WT_G3x5_TSCVNAVProfileHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCVNAVProfileHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--vnavprofile-padding-left, 0.5em);
            top: var(--vnavprofile-padding-top, 0.5em);
            width: calc(100% - var(--vnavprofile-padding-left, 0.5em) - var(--vnavprofile-padding-right, 0.5em));
            height: calc(100% - var(--vnavprofile-padding-top, 0.5em) - var(--vnavprofile-padding-bottom, 0.5em));
            color: white;
        }
            #top {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 50%;
                display: grid;
                grid-template-rows: var(--vnavprofile-top-grid-rows, 1fr 1.33fr);
                grid-template-columns: 1fr 1fr;
                grid-gap: var(--vnavprofile-top-grid-gap, 0.5em 1em);
                justify-items: center;
            }
                #waypoint {
                    position: relative;
                    width: 100%;
                }
                    #waypointtitle {
                        position: absolute;
                        left: 0%;
                        top: 25%;
                        width: 100%;
                        transform: translateY(-50%);
                        text-align: center;
                    }
                    #waypointident {
                        position: absolute;
                        left: 0%;
                        top: 75%;
                        width: 50%;
                        transform: translateY(-50%);
                    }
                    #waypointaltitude {
                        position: absolute;
                        left: 50%;
                        top: 75%;
                        width: 50%;
                        transform: translateY(-50%);
                    }
                #enable {
                    width: 80%;
                }
                #vstarget {
                    width: 75%;
                    transform: rotateX(0deg);
                    --button-value-label-top: 5%;
                    --button-value-label-height: 50%;
                }
                #fpa {
                    width: 75%;
                    --button-value-label-top: 5%;
                    --button-value-label-height: 50%;
                }
            #bottom {
                position: absolute;
                left: 0%;
                top: 50%;
                width: 100%;
                height: 50%;
                display: grid;
                grid-template-rows: 1fr 1fr;
                grid-template-columns: 1fr 1fr 1fr;
                grid-gap: var(--vnavprofile-bottom-grid-gap, 0);
                transform: rotateX(0deg);
            }
                .bottomField {
                    position: relative;
                    display: flex;
                    flex-flow: column nowrap;
                    justify-content: center;
                    align-items: stretch;
                }
                    .bottomTitle {
                        text-align: center;
                    }
                    .bottomValue {
                        text-align: center;
                    }
                #vnavdrct {
                    grid-area: 2 / 2;
                }
                    #vnavdrctcontent {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-flow: column nowrap;
                        justify-content: center;
                        align-items: center;
                    }
                        .drctSymbol {
                            width: calc(1.43 * 0.8em);
                            height: 0.8em;
                        }
                            .drctArrow {
                                fill: white;
                            }
                            .drctLetterD {
                                fill: transparent;
                                stroke-width: 10;
                                stroke: white;
                            }

        .unit {
            font-size: var(--vnavprofile-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="top">
            <wt-tsc-button-statusbar id="enable" labeltext="VNAV Enabled"></wt-tsc-button-statusbar>
            <div id="waypoint">
                <div id="waypointtitle">Active VNAV Waypoint</div>
                <div id="waypointident"></div>
                <div id="waypointaltitude">
                    <span id="waypointaltitudenumber"></span><span id="waypointaltitudeunit" class="unit"></span>
                </div>
            </div>
            <wt-tsc-button-value id="vstarget" labeltext="Vertical Speed<br>Target"></wt-tsc-button-value>
            <wt-tsc-button-value id="fpa" labeltext="Flight Path<br>Angle"></wt-tsc-button-value>
        </div>
        <div id="bottom">
            <div id="vsrequired" class="bottomField">
                <div class="bottomTitle">Vertical Speed<br>Required</div>
                <div class="bottomValue">
                    <span class="number"></span><span class="unit"></span>
                </div>
            </div>
            <div id="timeto" class="bottomField">
                <div class="bottomTitle"></div>
                <div class="bottomValue"></div>
            </div>
            <div id="vertdev" class="bottomField">
                <div class="bottomTitle">Vertical<br>Deviation</div>
                <div class="bottomValue">
                    <span class="number"></span><span class="unit"></span>
                </div>
            </div>
            <wt-tsc-button-content id="vnavdrct">
                <div id="vnavdrctcontent" slot="content">
                    <div>VNAV</div>
                    <svg class="drctSymbol" viewBox="0 -35 100 70">
                        <path class="drctArrow" d="M 5 -2.5 L 75 -2.5 L 75 -20 L 95 0 L 75 20 L 75 2.5 L 5 2.5 Z" />
                        <path class="drctLetterD" d="M 20 -30 L 30 -30 C 70 -30 70 30 30 30 L 20 30 Z" />
                    </svg>
                </div>
            </wt-tsc-button-content>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCVNAVProfileHTMLElement.NAME, WT_G3x5_TSCVNAVProfileHTMLElement);

/**
 * @typedef WT_G3x5_TSCVNAVProfileEvent
 * @property {WT_G3x5_TSCVNAVProfileHTMLElement} source
 * @property {WT_G3x5_TSCVNAVProfileHTMLElement.EventType} type
 * @property {Boolean} [enabled]
 * @property {WT_NumberUnitReadOnly} [vsTarget]
 * @property {Number} [fpa]
 */