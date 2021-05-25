class WT_G3x5_PFDAirspeedIndicator extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @property {WT_G3x5_PFDAirspeedIndicatorHTMLElement} htmlElement
     * @type {WT_G3x5_PFDAirspeedIndicatorHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

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
}

class WT_G3x5_PFDAirspeedIndicatorModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_SpeedBugCollection} speedBugCollection
     */
    constructor(airplane, airspeedSensor, speedBugCollection) {
        this._airplane = airplane;
        this._airspeedSensor = airspeedSensor;

        this._trendSmoother = new WT_ExponentialSmoother(WT_G3x5_PFDAirspeedIndicatorModel.TREND_SMOOTHING_CONSTANT);
        this._lastIASKnot = 0;
        this._lastTrendTime = 0;

        this._ias = WT_Unit.KNOT.createNumber(0);
        this._iasTrend = new WT_CompoundUnit([WT_Unit.KNOT], [WT_Unit.SECOND]).createNumber(0);
        this._mach = 0;
        this._refSpeed = WT_Unit.KNOT.createNumber(0);
        this._refMach = 0;

        this._speedBugCollection = speedBugCollection;
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
     * @property {WT_NumberUnitReadOnly} ias
     * @type {WT_NumberUnitReadOnly}
     */
    get ias() {
        return this._ias.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} iasTrend
     * @type {WT_NumberUnitReadOnly}
     */
    get iasTrend() {
        return this._iasTrend.readonly();
    }

    /**
     * @readonly
     * @property {Number} mach
     * @type {Number}
     */
    get mach() {
        return this._mach;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} refSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get refSpeed() {
        return ((this._airplane.autopilot.isFLCActive() || this._airplane.autopilot.isAirspeedHoldActive()) && !this._airplane.autopilot.isSpeedReferenceMach()) ? this._refSpeed.readonly() : null;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} refMach
     * @type {WT_NumberUnitReadOnly}
     */
    get refMach() {
        return ((this._airplane.autopilot.isFLCActive() || this._airplane.autopilot.isAirspeedHoldActive()) && this._airplane.autopilot.isSpeedReferenceMach()) ? this._refMach : null;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} maxSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get maxSpeed() {
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} minSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get minSpeed() {
    }

    /**
     * @readonly
     * @property {WT_SpeedBugCollection} speedBugCollection
     * @type {WT_SpeedBugCollection}
     */
    get speedBugCollection() {
        return this._speedBugCollection;
    }

    _updateIAS() {
        this._airspeedSensor.ias(this._ias);
    }

    _updateTrend() {
        let time = Date.now() / 1000;
        let dt = time - this._lastTrendTime;
        let accel = (this.ias.number - this._lastIASKnot) / dt;
        let value = this._trendSmoother.next(accel, dt);
        this._iasTrend.set(value);

        this._lastIASKnot = this.ias.number;
        this._lastTrendTime = time;
    }

    _updateMach() {
        this._mach = this._airspeedSensor.mach();
    }

    _updateRefSpeed() {
        this._airplane.autopilot.referenceAirspeed(this._refSpeed);
    }

    _updateRefMach() {
        this._refMach = this._airplane.autopilot.referenceMach();
    }

    update() {
        this._updateIAS();
        this._updateTrend();
        this._updateMach();
        this._updateRefSpeed();
        this._updateRefMach();
    }
}
WT_G3x5_PFDAirspeedIndicatorModel.TREND_SMOOTHING_CONSTANT = 2;

class WT_G3x5_PFDAirspeedIndicatorHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_PFDAirspeedIndicatorContext}
         */
        this._context = null;
        this._isInit = false;

        this._majorTicks = [];
        this._labels = [];
        this._minorTicks = [];
        this._tapeMin = null;
        this._tapeTranslate = 0;

        this._speedBugEntries = [];

        this._tempKnot = WT_Unit.KNOT.createNumber(0);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._updateFromContext();
    }

    _clearTape() {
        this._majorTicks.forEach(tick => this._tapeMajorTickLayer.removeChild(tick), this);
        this._labels.forEach(label => this._tapeLabelLayer.removeChild(label), this);
        this._minorTicks.forEach(tick => this._tapeMinorTickLayer.removechild(tick), this);

        this._majorTicks = [];
        this._labels = [];
        this._minorTicks = [];
    }

    _createMajorTicks(count) {
        for (let i = 0; i < count; i++) {
            let y = (1 - i / (count - 1)) * 100;

            let tick = document.createElementNS(Avionics.SVG.NS, "path");
            tick.classList.add(WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_TICK_MAJOR_CLASS);
            tick.setAttribute("vector-effect", "non-scaling-stroke");
            tick.setAttribute("d", `M 0 ${y} L 100 ${y}`);
            this._tapeMajorTickLayer.appendChild(tick);
            this._majorTicks.push(tick);

            let label = document.createElementNS(Avionics.SVG.NS, "text");
            label.classList.add(WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_LABEL_CLASS);
            label.setAttribute("x", `100%`);
            label.setAttribute("y", `${y}%`);
            label.setAttribute("alignment-baseline", "central");
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
            tick.classList.add(WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_TICK_MINOR_CLASS);
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

        this._updateTapeMin(scale.min);
    }

    _getSpeedBugHTMLElement(bug) {
    }

    _initSpeedBug(bug) {
        this._speedBugEntries.push({
            bug: bug,
            htmlElement: this._getSpeedBugHTMLElement(bug)
        });
    }

    _initSpeedBugs() {
        this._speedBugEntries = [];
        this._context.model.speedBugCollection.array.forEach(this._initSpeedBug.bind(this));
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._updateScale();
        this._initSpeedBugs();
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

    _calculateAbsoluteTapePosition(knots) {
        return 1 - (knots - this._tapeMin) / this._tapeLength;
    }

    _calculateTranslatedTapePosition(knots) {
        return (this._calculateAbsoluteTapePosition(knots) - this._tapeTranslate) * this._tapeLength / this._context.scale.window + 0.5;
    }

    _updateTapeLabels() {
        let min = this._tapeMin;
        let interval = this._context.scale.majorTick;
        this._labels.forEach((label, index) => {
            label.textContent = (min + interval * index).toFixed(0);
        });
    }

    _updateTapeMin(min) {
        this._tapeMin = min;
        this._updateTapeLabels();
    }

    _moveTape(tapePos) {
    }

    /**
     *
     * @param {WT_NumberUnit} ias
     */
    _updateTape(ias) {
        let scale = this._context.scale;
        let knots = ias.asUnit(WT_Unit.KNOT);
        let tapePos = this._calculateAbsoluteTapePosition(knots);
        if (tapePos <= 0.25 || tapePos >= 0.75) {
            let majorTick = scale.majorTick;
            this._updateTapeMin(Math.max(scale.min, Math.floor((knots - scale.window) / majorTick) * majorTick));
            tapePos = Math.max(0, Math.min(1, this._calculateAbsoluteTapePosition(knots)));
        }

        this._moveTape(tapePos);
        this._tapeTranslate = tapePos;
    }

    _showStrip(strip, value) {
    }

    _moveStrip(strip, minPos, maxPos) {
    }

    /**
     *
     * @param {Element} strip
     * @param {WT_G3x5_PFDAirspeedIndicatorStripDefinition} definition
     * @returns
     */
    _updateStrip(strip, definition) {
        if (!strip) {
            return;
        }

        let minPos = Math.min(1, Math.max(0, this._calculateAbsoluteTapePosition(definition.min)));
        let maxPos = Math.min(1, Math.max(0, this._calculateAbsoluteTapePosition(definition.max)));
        if (minPos === maxPos) {
            this._showStrip(strip, false);
        } else {
            this._showStrip(strip, true);
            this._moveStrip(strip, minPos, maxPos);
        }
    }

    _updateStrips() {
    }

    _setIASDigitToNoData(index) {
        let entry = this._iasDigits[index];
        entry.top.textContent = "";
        entry.middle.textContent = "-";
        entry.bottom.textContent = "";
        entry.digit.setAttribute("style", `transform: translateY(-50%);`);
    }

    _setIASDigitToSpeed(index, knots) {
        let entry = this._iasDigits[index];

        let place = Math.pow(10, index);
        let pivot = Math.floor(knots / place) * place;
        let digit = Math.floor(pivot / place) % 10;

        let translate = (knots - pivot) / place;
        let threshold = 1 - (1 / place);
        translate = (translate > threshold) ? (translate - threshold) * place : 0;
        if (translate >= 0.5) {
            pivot += place;
            digit = (digit + 1) % 10;
            translate -= 1;
        }

        let top = (digit + 1) % 10;
        let middle = digit;
        let bottom = (digit + 9) % 10;
        entry.top.textContent = `${top}`;
        entry.middle.textContent = (pivot < place) ? "" : `${middle}`;
        entry.bottom.textContent = (pivot - place < place) ? "" : `${bottom}`;

        entry.digit.setAttribute("style", `transform: translateY(${translate * 33.33 - 50}%);`);
    }

    _updateIASDigit(index, knots) {
        if (knots < this._context.scale.min) {
            this._setIASDigitToNoData(index);
        } else {
            this._setIASDigitToSpeed(index, knots);
        }
    }

    /**
     *
     * @param {WT_NumberUnit} ias
     */
    _updateIAS(ias) {
        let knots = ias.asUnit(WT_Unit.KNOT);
        for (let i = 0; i < 3; i++) {
            this._updateIASDigit(i, knots);
        }
    }

    _setTrendWarning(value) {
    }

    _showTrend(value) {
    }

    _setTrendLength(trend) {
    }

    /**
     *
     * @param {WT_NumberUnit} ias
     * @param {WT_NumberUnit} trend
     */
    _updateTrend(ias, trend) {
        let iasKnot = ias.asUnit(WT_Unit.KNOT);

        if (iasKnot < this._context.scale.min) {
            this._showTrend(false);
            return;
        }

        let trendEnd = iasKnot + trend;
        this._setTrendWarning(trendEnd >= this._context.model.maxSpeed.asUnit(WT_Unit.KNOT));
        if (Math.abs(trend) < this._context.trendThreshold) {
            this._showTrend(false);
        } else {
            this._showTrend(true);
            this._setTrendLength(trend);
        }
    }

    _showRefSpeed(value) {
    }

    _setRefSpeedDisplay(speed, isMach) {
    }

    _moveRefSpeedBug(tapePos) {
    }

    _updateRefSpeed() {
        let refSpeed = this._context.model.refSpeed;
        let refMach = this._context.model.refMach;
        if (refSpeed) {
            let refSpeedKnots = refSpeed.asUnit(WT_Unit.KNOT);
            this._setRefSpeedDisplay(refSpeed, false);
            this._moveRefSpeedBug(this._calculateTranslatedTapePosition(Math.max(this._context.scale.min, refSpeedKnots)));
            this._showRefSpeed(true);
        } else if (refMach !== null) {
            let refSpeedKnots = this._context.model.airplane.sensors.machToIAS(refMach, this._tempKnot).number;
            this._setRefSpeedDisplay(refMach, true);
            this._moveRefSpeedBug(this._calculateTranslatedTapePosition(Math.max(this._context.scale.min, refSpeedKnots)));
            this._showRefSpeed(true);
        } else {
            this._showRefSpeed(false);
        }
    }

    _showMach(value) {
    }

    _setMachDisplay(mach) {
    }

    _updateMach() {
        let mach = this._context.model.mach;
        if (mach >= this._context.machDisplayThreshold) {
            this._setMachDisplay(mach);
            this._showMach(true);
        } else {
            this._showMach(false);
        }
    }

    _setMaxSpeedWarning(value) {
    }

    _updateMaxSpeed(ias) {
        if (ias.compare(this._context.model.maxSpeed) >= 0) {
            this._setMaxSpeedWarning(true);
        } else {
            this._setMaxSpeedWarning(false);
        }
    }

    _setMinSpeedWarning(value) {
    }

    /**
     *
     * @param {WT_NumberUnit} ias
     * @param {WT_NumberUnit} trend
     */
    _updateMinSpeed(ias, trend) {
        if (this._context.model.airplane.sensors.isOnGround()) {
            this._setMinSpeedWarning(false);
            return;
        }

        let iasKnots = ias.asUnit(WT_Unit.KNOT);
        let trendEnd = iasKnots + trend;
        let minSpeed = this._context.model.minSpeed.asUnit(WT_Unit.KNOT);
        this._setMinSpeedWarning(trendEnd <= minSpeed || iasKnots < minSpeed);
    }

    _showSpeedBug(entry, value) {
    }

    _moveSpeedBug(entry, tapePos) {
    }

    /**
     *
     * @param {{bug:WT_SpeedBug, htmlElement:HTMLElement}} entry
     */
    _updateSpeedBug(entry) {
        if (entry.bug.show) {
            let speedKnots = entry.bug.speed.asUnit(WT_Unit.KNOT);
            this._moveSpeedBug(entry, this._calculateTranslatedTapePosition(Math.max(this._context.scale.min, speedKnots)));
            this._showSpeedBug(entry, true);
        } else {
            this._showSpeedBug(entry, false);
        }
    }

    _updateSpeedBugs() {
        this._speedBugEntries.forEach(this._updateSpeedBug.bind(this));
    }

    _updateDisplay() {
        let ias = this._context.model.ias;
        let trend = this._context.model.iasTrend.number * this._context.trendLookahead;
        this._updateTape(ias);
        this._updateStrips();
        this._updateIAS(ias);
        this._updateTrend(ias, trend);
        this._updateRefSpeed();
        this._updateMach();
        this._updateMaxSpeed(ias);
        this._updateMinSpeed(ias, trend);
        this._updateSpeedBugs();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_TICK_MAJOR_CLASS = "tickMajor";
WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_TICK_MINOR_CLASS = "tickMinor";
WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_LABEL_CLASS = "label";

/**
 * @typedef WT_G3x5_PFDAirspeedIndicatorContext
 * @property {WT_G3x5_PFDAirspeedIndicatorModel} model
 * @property {{min:Number, window:Number, majorTick:Number, minorTickFactor:Number}} scale
 * @property {Number} trendLookahead
 * @property {Number} trendThreshold
 * @property {Number} machDisplayThreshold
 * @property {WT_G3x5_PFDAirspeedIndicatorStripDefinition} [barberStrip]
 * @property {WT_G3x5_PFDAirspeedIndicatorStripDefinition} [greenStrip]
 * @property {WT_G3x5_PFDAirspeedIndicatorStripDefinition} [whiteStrip]
 * @property {WT_G3x5_PFDAirspeedIndicatorStripDefinition} [yellowStrip]
 * @property {WT_G3x5_PFDAirspeedIndicatorStripDefinition} [redStrip]
 */

class WT_G3x5_PFDAirspeedIndicatorStripDefinition {
    /**
     * @readonly
     * @property {Number} min
     * @type {Number}
     */
    get min() {
    }

    /**
     * @readonly
     * @property {Number} max
     * @type {Number}
     */
    get max() {
    }
}

class WT_G3x5_PFDAirspeedIndicatorConstantStripDefinition extends WT_G3x5_PFDAirspeedIndicatorStripDefinition {
    /**
     * @param {Number} min
     * @param {Number} max
     */
    constructor(min, max) {
        super();

        this._min = min;
        this._max = max;
    }

    /**
     * @readonly
     * @property {Number} min
     * @type {Number}
     */
    get min() {
        return this._min;
    }

    /**
     * @readonly
     * @property {Number} max
     * @type {Number}
     */
    get max() {
        return this._max;
    }
}

class WT_G3x5_PFDAirspeedIndicatorSpeedBug extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._labelText = "";
        this._show = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_PFDAirspeedIndicatorSpeedBug.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._label = this.shadowRoot.querySelector(`#label`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._updateLabel();
        this._updateShow();
    }

    _updateLabel() {
        this._label.textContent = this._labelText;
    }

    _updateShow() {
        this._wrapper.setAttribute("show", `${this._show}`);
    }

    /**
     *
     * @param {String} text
     */
    setLabel(text) {
        if (text === this._labelText) {
            return;
        }

        this._labelText = text;
        if (this._isInit) {
            this._updateLabel();
        }
    }

    show(value) {
        if (value === this._show) {
            return;
        }

        this._show = value;
        if (this._isInit) {
            this._updateShow();
        }
    }
}
WT_G3x5_PFDAirspeedIndicatorSpeedBug.NAME = "wt-pfd-airspeedindicator-speedbug";
WT_G3x5_PFDAirspeedIndicatorSpeedBug.TEMPLATE = document.createElement("template");
WT_G3x5_PFDAirspeedIndicatorSpeedBug.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            color: white;
        }

        #wrapper {
            position: absolute;
            left: 0%;
            top: 50%;
            width: 100%;
            height: calc(1em * 1.2);
            transform: translateY(-50%);
        }
        #wrapper[show="false"] {
            display: none;
        }
            #arrow {
                position: absolute;
                left: 0%;
                top: 0%;
                width: var(--airspeedindicator-speedbug-arrow-width, 0.5em);
                height: 100%;
                fill: var(--wt-g3x5-bggray);
            }
            #label {
                position: absolute;
                top: 0%;
                left: var(--airspeedindicator-speedbug-arrow-width, 0.5em);
                height: 100%;
                padding: 0 0.15em 0 0;
                background-color: var(--wt-g3x5-bggray);
            }
    </style>
    <div id="wrapper">
        <svg id="arrow" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 0 50 L 100 0 L 100 100 Z" />
        </svg>
        <div id="label"></div>
    </div>
`;

customElements.define(WT_G3x5_PFDAirspeedIndicatorSpeedBug.NAME, WT_G3x5_PFDAirspeedIndicatorSpeedBug);

class WT_G3x5_PFDAirspeedIndicatorSpeedBugRecycler extends WT_HTMLElementRecycler {
    _createElement() {
        return new WT_G3x5_PFDAirspeedIndicatorSpeedBug();
    }
}