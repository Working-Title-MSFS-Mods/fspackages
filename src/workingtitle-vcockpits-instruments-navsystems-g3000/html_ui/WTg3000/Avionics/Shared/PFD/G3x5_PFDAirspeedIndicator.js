class WT_G3x5_PFDAirspeedIndicator extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @property {WT_G3000_PFDNavDMEInfoHTMLElement} htmlElement
     * @type {WT_G3000_PFDNavDMEInfoHTMLElement}
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
    constructor(airplane, speedBugCollection) {
        this._airplane = airplane;

        this._trendSmoother = new WT_ExponentialSmoother(WT_G3x5_PFDAirspeedIndicatorModel.TREND_SMOOTHING_FACTOR);
        this._lastIASKnot = 0;
        this._lastTrendTime = 0;

        this._ias = WT_Unit.KNOT.createNumber(0);
        this._iasTrend = new WT_CompoundUnit([WT_Unit.KNOT], [WT_Unit.SECOND]).createNumber(0);
        this._refSpeed = WT_Unit.KNOT.createNumber(0);

        this._speedBugCollection = speedBugCollection;
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
        return this._airplane.dynamics.mach();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} refSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get refSpeed() {
        return this._airplane.autopilot.isFLC() ? this._refSpeed.readonly() : null;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} Vmo
     * @type {WT_NumberUnitReadOnly}
     */
    get Vmo() {
        return this._airplane.references.Vmo;
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
     * @property {WT_AirplaneAutopilot} autopilot
     * @type {WT_AirplaneAutopilot}
     */
     get autopilot() {
        return this._airplane.autopilot;
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
        this._airplane.dynamics.ias(this._ias);
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

    _updateRefSpeed() {
        this._airplane.autopilot.referenceAirspeed(this._refSpeed);
    }

    update() {
        this._updateIAS();
        this._updateTrend();
        this._updateRefSpeed();
    }
}
WT_G3x5_PFDAirspeedIndicatorModel.TREND_SMOOTHING_FACTOR = 3;

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
        this._context.model.speedBugCollection.forEachBug(this._initSpeedBug.bind(this));
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

    _updateStrip(strip, definition) {
        if (!strip) {
            return;
        }

        strip.setAttribute("hide", "true");

        let minPos = 1 - Math.min(1, Math.max(0, (definition.min - this._tapeMin) / this._tapeLength));
        let maxPos = 1 - Math.min(1, Math.max(0, (definition.max - this._tapeMin) / this._tapeLength));
        if (minPos === maxPos) {
            return;
        }

        strip.setAttribute("hide", "false");
        strip.style.top = `${maxPos * 100}%`;
        strip.style.height = `${(minPos - maxPos) * 100}%`;
    }

    _updateStrips() {
    }

    _updateTapeMin(min) {
        this._tapeMin = min;
        this._updateTapeLabels();
        this._updateStrips();
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
            tapePos = this._calculateAbsoluteTapePosition(knots);
        }

        this._moveTape(tapePos);
        this._tapeTranslate = tapePos;
    }

    _updateIASDigit(index, knots) {
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

        entry.digit.style.transform = `translateY(${translate * 33.33 - 50}%)`;
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

    /**
     *
     * @param {WT_NumberUnit} ias
     * @param {WT_NumberUnit} trend
     */
    _updateTrend(ias, trend) {
        let trendEnd = ias.asUnit(WT_Unit.KNOT) + trend;
        this._setTrendWarning(trendEnd >= this._context.model.Vmo.asUnit(WT_Unit.KNOT));
        if (Math.abs(trend) < this._context.trendThreshold) {
            this._trend.setAttribute("hide", true);
        } else {
            this._trend.setAttribute("hide", false);
            this._trend.element.style.transform = `scaleY(${Math.max(-this._tapeLength / 2, Math.min(this._tapeLength / 2, -trend))})`;
        }
    }

    _showRefSpeed(value) {
    }

    _setRefSpeedDisplay(text) {
        this._refSpeed.innerHTML = text;
    }

    _moveRefSpeedBug(tapePos) {
    }

    _updateRefSpeed() {
        let refSpeed = this._context.model.refSpeed;
        if (refSpeed) {
            let refSpeedKnots = refSpeed.asUnit(WT_Unit.KNOT);
            this._setRefSpeedDisplay(refSpeedKnots.toFixed(0));
            this._moveRefSpeedBug(this._calculateTranslatedTapePosition(refSpeedKnots));
            this._showRefSpeed(true);
        } else {
            this._showRefSpeed(false);
        }
    }

    _showMach(value) {
    }

    _updateMach() {
        let mach = this._context.model.mach;
        if (mach >= this._context.machDisplayThreshold) {
            this._mach.innerHTML = `M ${mach.toFixed(3).replace(/^0\./, ".")}`;
            this._showMach(true);
        } else {
            this._showMach(false);
        }
    }

    _setVmoWarning(value) {
    }

    _updateVmo(ias) {
        if (ias.compare(this._context.model.Vmo) >= 0) {
            this._setVmoWarning(true);
        } else {
            this._setVmoWarning(false);
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
            this._moveSpeedBug(entry, this._calculateTranslatedTapePosition(entry.bug.speed.asUnit(WT_Unit.KNOT)));
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
        this._updateIAS(ias);
        this._updateTrend(ias, trend);
        this._updateRefSpeed();
        this._updateMach();
        this._updateVmo(ias);
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
WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_TICK_MAJOR_CLASS = "tickmajor";
WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_TICK_MINOR_CLASS = "tickmajor";
WT_G3x5_PFDAirspeedIndicatorHTMLElement.TAPE_LABEL_CLASS = "label";

/**
 * @typedef WT_G3x5_PFDAirspeedIndicatorContext
 * @property {WT_G3x5_PFDAirspeedIndicatorModel} model
 * @property {{min:Number, window:Number, majorTick:Number, minorTickFactor:Number}} scale
 * @property {Number} trendLookahead
 * @property {Number} trendThreshold
 * @property {Number} machDisplayThreshold
 * @property {{min:Number, max:Number}} [barberStrip]
 * @property {{min:Number, max:Number}} [greenStrip]
 * @property {{min:Number, max:Number}} [whiteStrip]
 * @property {{min:Number, max:Number}} [yellowStrip]
 * @property {{min:Number, max:Number}} [redStrip]
 */

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
        this._label.innerHTML = this._labelText;
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