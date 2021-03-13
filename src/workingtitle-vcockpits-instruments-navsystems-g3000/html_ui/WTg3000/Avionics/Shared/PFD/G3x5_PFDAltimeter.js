class WT_G3x5_PFDAltimeter extends WT_G3x5_PFDElement {
    constructor() {
        super();

        this._initController();
    }

    _initController() {
        this._controller = new WT_DataStoreController("PFD", null);
        this._controller.addSetting(this._baroUnitsSetting = new WT_G3x5_PFDBaroUnitsSetting(this._controller));
        this._controller.addSetting(this._metersSetting = new WT_G3x5_PFDAltimeterMetersSetting(this._controller));

        this._controller.init();
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDAltimeterHTMLElement} htmlElement
     * @type {WT_G3x5_PFDAltimeterHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDBaroUnitsSetting} baroUnitsSetting
     * @type {WT_G3x5_PFDBaroUnitsSetting}
     */
    get baroUnitsSetting() {
        return this._baroUnitsSetting;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDAltimeterMetersSetting} metersSetting
     * @type {WT_G3x5_PFDAltimeterMetersSetting}
     */
     get metersSetting() {
        return this._metersSetting;
    }

    /**
     *
     * @returns {WT_G3x5_PFDAltimeterModel}
     */
    _createModel() {
    }

    _createHTMLElement() {
    }

    _initSettingsListeners() {
        this.baroUnitsSetting.addListener(this._onBaroUnitsSettingChanged.bind(this));
        this.metersSetting.addListener(this._onMetersSettingChanged.bind(this));
    }

    init(root) {
        this._model = this._createModel();

        let container = root.querySelector(`#InstrumentsContainer`);
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);

        this._initSettingsListeners();
        this._updateBaroUnits();
        this._updateMeters();
    }

    _updateBaroUnits() {
        this._model.setBaroPressureUnit(WT_G3x5_PFDAltimeter.BARO_UNITS[this.baroUnitsSetting.getValue()]);
    }

    _updateMeters() {
        this._model.setShowMeters(this.metersSetting.getValue());
    }

    _onBaroUnitsSettingChanged(setting, newValue, oldValue) {
        this._updateBaroUnits();
    }

    _onMetersSettingChanged(setting, newValue, oldValue) {
        this._updateMeters();
    }

    onUpdate(deltaTime) {
        this._model.update();
        this.htmlElement.update();
    }
}
WT_G3x5_PFDAltimeter.BARO_UNITS = [
    WT_Unit.IN_HG,
    WT_Unit.HPA
];

class WT_G3x5_PFDAltimeterModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {Number} index
     */
    constructor(airplane, index) {
        this._airplane = airplane;
        this._index = index;

        this._showMeters = false;
        this._baroPressureModel = new WT_NumberUnitModelSimVar(WT_Unit.HPA, `KOHLSMAN SETTING MB:${this._index}`, "millibars", undefined, true);

        this._trendSmoother = new WT_ExponentialSmoother(WT_G3x5_PFDAirspeedIndicatorModel.TREND_SMOOTHING_FACTOR);
        this._lastIASKnot = 0;
        this._lastTrendTime = 0;

        this._indicatedAltitude = WT_Unit.FOOT.createNumber(0);
        this._verticalSpeed = WT_Unit.FPM.createNumber(0);
        this._selectedAltitude = WT_Unit.FOOT.createNumber(0);

        this._showReferenceVSpeed = false;
        this._referenceVSpeed = WT_Unit.FPM.createNumber(0);
    }

    /**
     * @readonly
     * @property {WT_PlayerAirplane} autopilot
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} indicatedAltitude
     * @type {WT_NumberUnitReadOnly}
     */
    get indicatedAltitude() {
        return this._indicatedAltitude.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} verticalSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get verticalSpeed() {
        return this._verticalSpeed.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} selectedAltitude
     * @type {WT_NumberUnitReadOnly}
     */
    get selectedAltitude() {
        return this._selectedAltitude.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} referenceVSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get referenceVSpeed() {
        return this._showReferenceVSpeed ? this._referenceVSpeed.readonly() : null;
    }

    getShowMeters() {
        return this._showMeters;
    }

    setShowMeters(value) {
        this._showMeters = value;
    }

    getBaroPressure() {
        return this._baroPressureModel.getValue();
    }

    setBaroPressure(pressure) {
        this._baroPressureModel.setValue(pressure);
    }

    getBaroPressureUnit() {
        return this._baroPressureModel.getUnit();
    }

    setBaroPressureUnit(unit) {
        this._baroPressureModel.setUnit(unit);
    }

    _updateAltitude() {
        this._airplane.navigation.altitudeIndicated(this._indicatedAltitude);
    }

    _updateVSpeed() {
        this._airplane.navigation.verticalSpeed(this._verticalSpeed);
    }

    _updateSelectedAltitude() {
        this._airplane.autopilot.selectedAltitude(this._selectedAltitude);
    }

    _updateReferenceVSpeed() {
        if (this._airplane.autopilot.isVS()) {
            this._showReferenceVSpeed = true;
            this._airplane.autopilot.referenceVS(this._referenceVSpeed);
        } else {
            this._showReferenceVSpeed = false;
        }
    }

    update() {
        this._updateAltitude();
        this._updateVSpeed();
        this._updateSelectedAltitude();
        this._updateReferenceVSpeed();
    }
}

class WT_G3x5_PFDAltimeterHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_PFDAltimeterContext}
         */
        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_PFDAltimeterHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
    }

    /**
     *
     * @returns {WT_G3x5_PFDAltimeterAltitudeHTMLElement}
     */
    _createAltitudeHTMLElement() {
    }

    /**
     *
     * @returns {WT_G3x5_PFDAltimeterVSpeedHTMLElement}
     */
    _createVSpeedElement() {
        return new WT_G3x5_PFDAltimeterVSpeedHTMLElement();
    }

    _initChildren() {
        this._altitude = this._createAltitudeHTMLElement();
        this._vSpeed = this._createVSpeedElement();

        this._altitude.id = WT_G3x5_PFDAltimeterHTMLElement.ALTITUDE_ID;
        this._vSpeed.id = WT_G3x5_PFDAltimeterHTMLElement.VSPEED_ID;

        this._wrapper.appendChild(this._altitude);
        this._wrapper.appendChild(this._vSpeed);
    }

    connectedCallback() {
        this._defineChildren();
        this._initChildren();
        this._isInit = true;
        this._updateFromContext();
    }

    _updateAltitudeContext() {
        this._altitude.setContext({
            model: this._context.model,
            scale: this._context.altScale,
            trendLookahead: this._context.trendLookahead,
            trendThreshold: this._context.trendThreshold
        });
    }

    _updateVSpeedContext() {
        this._vSpeed.setContext({
            model: this._context.model,
            scale: this._context.vSpeedScale,
            threshold: this._context.vSpeedThreshold
        });
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._updateAltitudeContext();
        this._updateVSpeedContext();
    }

    /**
     *
     * @param {WT_G3x5_PFDAirspeedIndicatorContext} context
     */
    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _updateDisplay() {
        this._altitude.update();
        this._vSpeed.update();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDAltimeterHTMLElement.GLIDESLOPE_ID = "glideslope";
WT_G3x5_PFDAltimeterHTMLElement.ALTITUDE_ID = "altitude";
WT_G3x5_PFDAltimeterHTMLElement.VSPEED_ID = "vspeed";
WT_G3x5_PFDAltimeterHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDAltimeterHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #${WT_G3x5_PFDAltimeterHTMLElement.GLIDESLOPE_ID} {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 12.5%;
                height: 100%;
            }
            #${WT_G3x5_PFDAltimeterHTMLElement.ALTITUDE_ID} {
                position: absolute;
                left: 12.5%;
                top: 0%;
                width: 50%;
                height: 100%;
            }
            #${WT_G3x5_PFDAltimeterHTMLElement.VSPEED_ID} {
                position: absolute;
                right: 0%;
                top: 0%;
                width: 37.5%;
                height: 100%;
            }
    </style>
    <div id="wrapper">
    </div>
`;

/**
* @typedef WT_G3x5_PFDAltimeterContext
* @property {WT_G3x5_PFDAltimeterModel} model
* @property {{window:Number, majorTick:Number, minorTickFactor:Number}} altScale
* @property {{window:Number, majorTick:Number, minorTickFactor}} vSpeedScale
* @property {Number} trendLookahead
* @property {Number} trendThreshold
*/

class WT_G3x5_PFDAltimeterAltitudeHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_PFDAltimeterAltitudeContext}
         */
        this._context = null;
        this._isInit = false;

        this._majorTicks = [];
        this._labels = [];
        this._minorTicks = [];
        this._tapeMin = null;
        this._tapeTranslate = 0;
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._updateFromContext();
    }

    _clearTape() {
        this._majorTicks.forEach(tick => this._tapeMajorTickLayer.removeChild(tick));
        this._labels.forEach(label => this._tapeLabelLayer.removeChild(label));
        this._minorTicks.forEach(tick => this._tapeMinorTickLayer.removechild(tick));

        this._majorTicks = [];
        this._labels = [];
        this._minorTicks = [];
    }

    _createMajorTicks(count) {
        for (let i = 0; i < count; i++) {
            let y = (1 - i / (count - 1)) * 100;

            let tick = document.createElementNS(Avionics.SVG.NS, "path");
            tick.classList.add(WT_G3x5_PFDAltimeterAltitudeHTMLElement.TAPE_TICK_MAJOR_CLASS);
            tick.setAttribute("vector-effect", "non-scaling-stroke");
            tick.setAttribute("d", `M 0 ${y} L 100 ${y}`);
            this._tapeMajorTickLayer.appendChild(tick);
            this._majorTicks.push(tick);

            let label = document.createElementNS(Avionics.SVG.NS, "text");
            label.classList.add(WT_G3x5_PFDAltimeterAltitudeHTMLElement.TAPE_LABEL_CLASS);
            label.setAttribute("x", `100%`);
            label.setAttribute("y", `${y}%`);
            this._tapeLabelLayer.appendChild(label);
            this._labels.push(label);
        }
    }

    _createMinorTicks(majorTickCount, factor) {
        if (factor <= 1) {
            return;
        }

        let count = (majorTickCount - 1) * factor;
        for (let i = 0; i < count; i++) {
            if (i % factor === 0) {
                continue;
            }

            let y = (1 - i / count) * 100;
            let tick = document.createElementNS(Avionics.SVG.NS, "path");
            tick.classList.add(WT_G3x5_PFDAltimeterAltitudeHTMLElement.TAPE_TICK_MINOR_CLASS);
            tick.setAttribute("vector-effect", "non-scaling-stroke");
            tick.setAttribute("d", `M 0 ${y} L 100 ${y}`);
            this._tapeMinorTickLayer.appendChild(tick);
            this._minorTicks.push(tick);
        }
    }

    _updateScale() {
        this._clearTape();

        let scale = this._context.scale;
        let numMajorTicks = Math.ceil(scale.window / scale.majorTick) * 2 + 1;
        this._tapeLength = (numMajorTicks - 1) * scale.majorTick;
        this._tape.style.height = `${100 * this._tapeLength / scale.window}%`;
        this._trend.setAttribute("height", `${100 / scale.window}%`);

        this._createMajorTicks(numMajorTicks);
        this._createMinorTicks(numMajorTicks, Math.floor(scale.minorTickFactor));

        this._updateTapeMin(0);
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._updateScale();
    }

    /**
     *
     * @param {WT_G3x5_PFDAltimeterAltitudeContext} context
     */
    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _calculateAbsoluteTapePosition(feet) {
        return 1 - (feet - this._tapeMin) / this._tapeLength;
    }

    _calculateTranslatedTapePosition(knots) {
        return (this._calculateAbsoluteTapePosition(knots) - this._tapeTranslate) * this._tapeLength / this._context.scale.window + 0.5;
    }

    _updateTapeLabel(label, number) {
    }

    _updateTapeLabels() {
        let min = this._tapeMin;
        let interval = this._context.scale.majorTick;
        this._labels.forEach((label, index) => {
            this._updateTapeLabel(label, min + interval * index);
        });
    }

    _updateTapeMin(min) {
        this._tapeMin = min;
        this._updateTapeLabels();
    }

    _moveTape(tapePos) {
    }

    _updateTape() {
        let scale = this._context.scale;
        let feet = this._context.model.indicatedAltitude.asUnit(WT_Unit.FOOT);
        let tapePos = this._calculateAbsoluteTapePosition(feet);
        if (tapePos <= 0.25 || tapePos >= 0.75) {
            let majorTick = scale.majorTick;
            this._updateTapeMin(Math.floor((feet - scale.window) / majorTick) * majorTick);
            tapePos = this._calculateAbsoluteTapePosition(feet);
        }

        this._moveTape(tapePos);
        this._tapeTranslate = tapePos;
    }

    _updateIndicatedAltitudeDigit(index, feet) {
        let isNegative = feet < 0;
        let feetAbs = Math.abs(feet);
        let entry = this._indicatedAltitudeDigits[index];

        let place = Math.pow(10, index + 1);
        let pivot = Math.floor(feetAbs / place) * place;
        let digit = Math.floor(pivot / place) % 10;

        let translate = (isNegative ? -1 : 1) * (feetAbs - pivot) / place;
        let thresholdPlace = place / 10;
        let threshold = 1 - (1 / thresholdPlace);
        translate = (translate > threshold) ? ((translate - threshold) * thresholdPlace) : 0;
        if (Math.abs(translate) >= 0.5) {
            pivot += place;
            digit = (digit + 1) % 10;
            translate += isNegative ? 1 : -1;
        }

        let isZero = pivot === 0;
        let top = isZero ? 1 : ((digit + (isNegative ? 9 : 1)) % 10);
        let middle = digit;
        let bottom = isZero ? 1 : ((digit + (isNegative ? 1 : 9)) % 10);
        let suffix = (index === 0) ? "0" : "";
        let canHide = index > 1;
        entry.top.textContent = (canHide && isNegative && (pivot - place < place)) ? "" : `${top}${suffix}`;
        entry.middle.textContent = (canHide && pivot < place) ? "" : `${middle}${suffix}`;
        entry.bottom.textContent = (canHide && !isNegative && (pivot - place < place)) ? "" : `${bottom}${suffix}`;

        entry.digit.style.transform = `translateY(${translate * 33.33 - 50}%)`;
    }

    _setIndicatedAltitudeSignPlace(place) {
    }

    _updateIndicatedAltitudeSign(feet) {
        let place;
        if (feet >= 0) {
            place = -1;
        } else {
            place = (-feet).toFixed(0).length;
        }
        this._setIndicatedAltitudeSignPlace(place);
    }

    _updateIndicatedAltitude() {
        let feet = this._context.model.indicatedAltitude.asUnit(WT_Unit.FOOT);
        for (let i = 0; i < 4; i++) {
            this._updateIndicatedAltitudeDigit(i, feet);
        }
        this._updateIndicatedAltitudeSign(feet);
    }

    _showTrend(value) {
    }

    _setTrendLength(trend) {
    }

    _updateTrend() {
        let trend = this._context.model.verticalSpeed.asUnit(WT_Unit.FPM) * this._context.trendLookahead / 60;
        if (Math.abs(trend) < this._context.trendThreshold) {
            this._showTrend(false);
        } else {
            this._showTrend(true);
            this._setTrendLength(trend);
        }
    }

    _setSelectedAltitudeDisplay(number) {
    }

    _moveSelectedAltitudeBug(tapePos) {
    }

    _updateSelectedAltitude() {
        let selectedAltFeet = this._context.model.selectedAltitude.asUnit(WT_Unit.FOOT);
        this._setSelectedAltitudeDisplay(selectedAltFeet);
        this._moveSelectedAltitudeBug(this._calculateTranslatedTapePosition(selectedAltFeet));
    }

    _setBaroNumberText(text) {
    }

    _setBaroUnitText(text) {
    }

    _updateBaro() {
        let unit = this._context.model.getBaroPressureUnit();
        let number = this._context.model.getBaroPressure().asUnit(unit);

        let numberText = (unit === WT_Unit.HPA) ? number.toFixed(0) : number.toFixed(2);
        let unitText = (unit === WT_Unit.HPA) ? "HPA" : "IN";
        this._setBaroNumberText(numberText);
        this._setBaroUnitText(unitText);
    }

    _showMeters(value) {
    }

    _setIndicatedAltitudeMetersDisplay(altitude) {
    }

    _setSelectedAltitudeMetersDisplay(altitude) {
    }

    _updateMeters() {
        if (this._context.model.getShowMeters()) {
            this._setIndicatedAltitudeMetersDisplay(this._context.model.indicatedAltitude);
            this._setSelectedAltitudeMetersDisplay(this._context.model.selectedAltitude);
            this._showMeters(true);
        } else {
            this._showMeters(false);
        }
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateTape();
        this._updateIndicatedAltitude();
        this._updateTrend();
        this._updateSelectedAltitude();
        this._updateBaro();
        this._updateMeters();
    }
}
WT_G3x5_PFDAltimeterAltitudeHTMLElement.TAPE_TICK_MAJOR_CLASS = "tickmajor";
WT_G3x5_PFDAltimeterAltitudeHTMLElement.TAPE_TICK_MINOR_CLASS = "tickmajor";
WT_G3x5_PFDAltimeterAltitudeHTMLElement.TAPE_LABEL_CLASS = "label";

/**
* @typedef WT_G3x5_PFDAltimeterAltitudeContext
* @property {WT_G3x5_PFDAltimeterModel} model
* @property {{window:Number, majorTick:Number, minorTickFactor:Number}} scale
* @property {Number} trendLookahead
* @property {Number} trendThreshold
*/

class WT_G3x5_PFDAltimeterVSpeedHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_PFDAltimeterVSpeedContext}
         */
         this._context = null;
         this._isInit = false;

        this._majorTicks = [];
        this._labels = [];
        this._minorTicks = [];
    }

    _getTemplate() {
        return WT_G3x5_PFDAltimeterVSpeedHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._majorTickLayer = this.shadowRoot.querySelector(`#majorticks`);
        this._labelLayer = this.shadowRoot.querySelector(`#labels`);
        this._minorTickLayer = this.shadowRoot.querySelector(`#minorticks`);

        this._pointerContainer = this.shadowRoot.querySelector(`#pointercontainer`);
        this._pointer = new WT_CachedElement(this.shadowRoot.querySelector(`#pointer`));
        this._pointerNumber = new WT_CachedElement(this.shadowRoot.querySelector(`#pointernumber`));
        this._pointerSign = new WT_CachedElement(this.shadowRoot.querySelector(`#pointersign`));

        this._reference = new WT_CachedElement(this.shadowRoot.querySelector(`#reference`));
        this._referenceBugContainer = new WT_CachedElement(this.shadowRoot.querySelector(`#referencebugcontainer`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._updateFromContext();
    }

    _clearScale() {
        this._majorTicks.forEach(tick => this._majorTickLayer.removeChild(tick));
        this._labels.forEach(label => this._labelLayer.removeChild(label));
        this._minorTicks.forEach(tick => this._minorTickLayer.removechild(tick));

        this._majorTicks = [];
        this._labels = [];
        this._minorTicks = [];
    }

    _setTapeLabel(label, number) {
        let text = (number / 1000).toFixed(1).replace(/\.?0$/, "");
        label.textContent = text;
    }

    _createTick(y) {
        let tick = document.createElementNS(Avionics.SVG.NS, "path");
        tick.classList.add(WT_G3x5_PFDAltimeterVSpeedHTMLElement.TAPE_TICK_MAJOR_CLASS);
        tick.setAttribute("vector-effect", "non-scaling-stroke");
        tick.setAttribute("d", `M 0 ${y} L 100 ${y}`);
        return tick;
    }

    _createLabel(y) {
        let label = document.createElementNS(Avionics.SVG.NS, "text");
        label.classList.add(WT_G3x5_PFDAltimeterVSpeedHTMLElement.TAPE_LABEL_CLASS);
        label.setAttribute("x", `0%`);
        label.setAttribute("y", `${y}%`);
        return label;
    }

    _createMajorTicks(window, count, interval) {
        let halfWindow = window / 2;

        for (let i = 0; i < count; i++) {
            let value = (i + 1) * interval;
            let yOffset = (value / halfWindow) * 50;

            let tickPositive = this._createTick(50 - yOffset);
            this._majorTickLayer.appendChild(tickPositive);
            this._majorTicks.push(tickPositive);

            let tickNegative = this._createTick(50 + yOffset);
            this._majorTickLayer.appendChild(tickNegative);
            this._majorTicks.push(tickNegative);

            let labelPositive = this._createLabel(50 - yOffset);
            this._labelLayer.appendChild(labelPositive);
            this._labels.push(labelPositive);
            this._setTapeLabel(labelPositive, value);

            let labelNegative = this._createLabel(50 + yOffset);
            this._labelLayer.appendChild(labelNegative);
            this._labels.push(labelNegative);
            this._setTapeLabel(labelNegative, value);
        }
    }

    _createMinorTicks(window, count, interval, factor) {
        if (factor <= 1) {
            return;
        }

        let halfWindow = window / 2;
        for (let i = 0; i < count; i++) {
            if ((i + 1) % factor === 0) {
                continue;
            }

            let value = (i + 1) * interval;
            let yOffset = (value / halfWindow) * 50;

            let tickPositive = this._createTick(50 - yOffset);
            this._minorTickLayer.appendChild(tickPositive);
            this._minorTicks.push(tickPositive);

            let tickNegative = this._createTick(50 + yOffset);
            this._minorTickLayer.appendChild(tickNegative);
            this._minorTicks.push(tickNegative);
        }
    }

    _updateScale() {
        this._clearScale();

        let scale = this._context.scale;
        let minorTickInterval = scale.majorTick / scale.minorTickFactor;
        let numMajorTicks = Math.floor(scale.window / scale.majorTick / 2);
        let numMinorTicks = Math.floor(scale.window / minorTickInterval / 2);

        this._createMajorTicks(scale.window, numMajorTicks, scale.majorTick);
        this._createMinorTicks(scale.window, numMinorTicks, minorTickInterval, scale.minorTickFactor);
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._updateScale();
    }

    /**
     *
     * @param {WT_G3x5_PFDAltimeterVSpeedContext} context
     */
    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _calculateVSPosition(fpm) {
        return -fpm / this._context.scale.window;
    }

    _showPointer(value) {
        this._pointer.setAttribute("show", `${value}`);
    }

    _setPointerDisplay(fpm) {
        let text = `${Math.round(Math.abs(fpm) / 50) * 50}`;
        this._pointerNumber.innerHTML = text;
        this._pointerSign.setAttribute("show", `${fpm < 0}`);
    }

    _movePointer(pos) {
        this._pointerContainer.setAttribute("style", `transform: translateY(${Math.min(0.5, Math.max(-0.5, pos)) * 100}%);`);
    }

    _updatePointer() {
        let fpm = this._context.model.verticalSpeed.asUnit(WT_Unit.FPM);
        if (Math.abs(fpm) < this._context.threshold) {
            this._showPointer(false);
        } else {
            this._setPointerDisplay(fpm);
            this._movePointer(this._calculateVSPosition(fpm));
            this._showPointer(true);
        }
    }

    _showReference(value) {
        this._wrapper.setAttribute("show-reference", `${value}`);
    }

    _setReferenceNumber(fpm) {
        this._reference.innerHTML = `${fpm.toFixed(0)}`;
    }

    _moveReferenceBug(pos) {
        this._referenceBugContainer.setAttribute("style", `transform: translateY(${Math.min(0.5, Math.max(-0.5, pos)) * 100}%);`);
    }

    _updateReference() {
        let reference = this._context.model.referenceVSpeed;
        if (reference) {
            let fpm = reference.asUnit(WT_Unit.FPM);
            this._showReference(true);
            this._setReferenceNumber(fpm);
            this._moveReferenceBug(this._calculateVSPosition(fpm));
        } else {
            this._showReference(false);
        }
    }

    _updateDisplay() {
        this._updatePointer();
        this._updateReference();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDAltimeterVSpeedHTMLElement.TAPE_TICK_MAJOR_CLASS = "tickmajor";
WT_G3x5_PFDAltimeterVSpeedHTMLElement.TAPE_TICK_MINOR_CLASS = "tickmajor";
WT_G3x5_PFDAltimeterVSpeedHTMLElement.TAPE_LABEL_CLASS = "label";
WT_G3x5_PFDAltimeterVSpeedHTMLElement.NAME = "wt-pfd-altimeter-vspeed";
WT_G3x5_PFDAltimeterVSpeedHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDAltimeterVSpeedHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #referencecontainer {
                position: absolute;
                left: 0%;
                bottom: 85.5%;
                width: 100%;
                height: 7%;
                font-size: var(--altimeter-vspeed-reference-font-size, 0.9em);
                background-color: var(--wt-g3x5-bggray);
                border-radius: var(--altimeter-vspeed-reference-border-radius, 3px);
                display: none;
            }
            #wrapper[show-reference="true"] #referencecontainer {
                display: block;
            }
                #reference {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--wt-g3x5-lightblue);
                }
            #bgclip {
                position: absolute;
                left: 0%;
                top: 15%;
                width: 75%;
                height: 70%;
                border-radius: 0 var(--altimeter-vspeed-bg-border-radius, 10px) var(--altimeter-vspeed-bg-border-radius, 10px) 0;
                overflow: hidden;
            }
                #bg {
                    width: 100%;
                    height: 100%;
                }
                    #bgglass {
                        fill: black;
                        fill-opacity: var(--altimeter-vspeed-bg-alpha, 0.2);
                    }
                    #bgarrow {
                        fill: transparent;
                        stroke: white;
                        stroke-width: 2;
                    }
            #scalecontainer {
                position: absolute;
                left: 0%;
                top: 17.5%;
                width: 100%;
                height: 65%;
            }
                #scale {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 75%;
                    height: 100%;
                }
                    #minorticks {
                        position: absolute;
                        left: 0%;
                        width: var(--altimeter-vspeed-minortick-width, 15%);
                        height: 100%;
                        stroke: white;
                        stroke-width: var(--altimeter-vspeed-minortick-stroke-width, 2px);
                    }
                    #majorticks {
                        position: absolute;
                        left: 0%;
                        width: var(--altimeter-vspeed-majortick-width, 30%);
                        height: 100%;
                        stroke: white;
                        stroke-width: var(--altimeter-vspeed-majortick-stroke-width, 2px);
                    }
                    #labels {
                        position: absolute;
                        left: calc(var(--altimeter-vspeed-majortick-width, 30%) + var(--altimeter-label-margin-left, 0.5em));
                        width: calc(100% - var(--altimeter-vspeed-majortick-width, 30%) - var(--altimeter-vspeed-label-margin-right, 0.5em));
                        height: 100%;
                        font-size: var(--altimeter-vspeed-label-font-size, 0.9em);
                        fill: white;
                        text-anchor: start;
                    }
                        .label {
                            dominant-baseline: middle;
                        }
                #referencebugclip {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    height: 100%;
                    width: 100%;
                    overflow-y: hidden;
                }
                    #referencebugcontainer {
                        position: absolute;
                        left: 0%;
                        top: 0%;
                        width: var(--altimeter-vspeed-minortick-width, 15%);
                        height: 100%;
                    }
                        #referencemanualbug {
                            position: absolute;
                            left: 0%;
                            top: 50%;
                            height: var(--altimeter-vspeed-pointer-font-size, 0.9em);
                            transform: translateY(-50%);
                            width: 66.67%;
                            fill: var(--wt-g3x5-lightblue);
                            stroke: #299aa0;
                            stroke-width: 5;
                            display: none;
                        }
                        #wrapper[show-reference="true"] #referencemanualbug {
                            display: block;
                        }
                #pointercontainer {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 100%;
                    font-size: var(--altimeter-vspeed-pointer-font-size, 0.9em);
                    color: white;
                }
                    #pointer {
                        position: absolute;
                        left: 0%;
                        top: 50%;
                        height: calc(1em * 1.2);
                        transform: translateY(-50%);
                        display: none;
                    }
                    #pointer[show="true"] {
                        display: block;
                    }
                        #pointerarrow {
                            position: absolute;
                            left: 0%;
                            top: 0%;
                            width: var(--altimeter-vspeed-pointer-arrow-width, 1em);
                            height: 100%;
                            fill: var(--wt-g3x5-bggray);
                        }
                        #pointersign {
                            position: absolute;
                            left: 0%;
                            top: 0%;
                            width: var(--altimeter-vspeed-pointer-arrow-width, 1em);
                            height: 100%;
                            text-align: right;
                            display: none;
                        }
                        #pointersign[show="true"] {
                            display: block;
                        }
                        #pointernumber {
                            position: absolute;
                            left: var(--altimeter-vspeed-pointer-arrow-width, 1em);
                            top: 0%;
                            height: 100%;
                            padding: 0 0.15em 0 0;
                            background-color: var(--wt-g3x5-bggray);
                        }
    </style>
    <div id="wrapper">
        <div id="referencecontainer">
            <div id="reference"></div>
        </div>
        <div id="bgclip">
            <svg id="bg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path id="bgglass" d="M 0 0 L 100 0 L 100 40 L 0 50 L 100 60 L 100 100 L 0 100 Z" />
                <path id="bgarrow" vector-effect="non-scaling-stroke" d="M 40 46 L 0 50 L 40 54" />
            </svg>
        </div>
        <div id="scalecontainer">
            <div id="scale">
                <svg id="minorticks" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                <svg id="majorticks" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                <svg id="labels"></svg>
            </div>
            <div id="referencebugclip">
                <div id="referencebugcontainer">
                    <svg id="referencemanualbug" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 100 0 h -100 v 100 h 100 v -33 L 33.33 50 L 100 33 Z" />
                    </svg>
                </div>
            </div>
            <div id="pointercontainer">
                <div id="pointer">
                    <svg id="pointerarrow" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 0 50 L 100 0 L 100 100 Z" />
                    </svg>
                    <div id="pointersign">−</div>
                    <div id="pointernumber"></div>
                </div>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDAltimeterVSpeedHTMLElement.NAME, WT_G3x5_PFDAltimeterVSpeedHTMLElement);

/**
* @typedef WT_G3x5_PFDAltimeterVSpeedContext
* @property {WT_G3x5_PFDAltimeterModel} model
* @property {{window:Number, majorTick:Number, minorTickFactor:Number}} scale
* @property {Number} threshold
*/

class WT_G3x5_PFDAltimeterGlideslopeHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));
    }
}