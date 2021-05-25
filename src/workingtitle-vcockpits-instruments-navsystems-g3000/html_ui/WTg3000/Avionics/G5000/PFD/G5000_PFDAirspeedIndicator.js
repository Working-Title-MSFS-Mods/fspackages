class WT_G5000_PFDAirspeedIndicator extends WT_G3x5_PFDAirspeedIndicator {
    _createSpeedBugCollection() {
        let collection = new WT_SpeedBugCollection("PFD");
        collection.addBug("1", this.instrument.airplane.references.V1);
        collection.addBug("r", this.instrument.airplane.references.Vr);
        collection.addBug("2", this.instrument.airplane.references.V2);
        collection.addBug("fto", this.instrument.airplane.references.Vfto);
        collection.addBug("ref", this.instrument.airplane.references.Vref);
        collection.addBug("app", this.instrument.airplane.references.Vapp);
        return collection;
    }

    _createModel() {
        return new WT_G5000_PFDAirspeedIndicatorModel(this.instrument.airplane, this.instrument.referenceAirspeedSensor, this._createSpeedBugCollection());
    }

    _getYellowStripMin() {
        let references = this.instrument.airplane.references;
        let range = references.aoaCritical - references.aoaZeroLift;
        return range * WT_G5000_PFDAirspeedIndicator.STRIP_YELLOW_AOA_NORM_MIN + references.aoaZeroLift;
    }

    _getRedStripMin() {
        let references = this.instrument.airplane.references;
        let range = references.aoaCritical - references.aoaZeroLift;
        return range * WT_G5000_PFDAirspeedIndicator.STRIP_RED_AOA_NORM_MIN + references.aoaZeroLift;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G5000_PFDAirspeedIndicatorHTMLElement();
        htmlElement.setContext({
            model: this._model,
            scale: {
                min: WT_G5000_PFDAirspeedIndicator.TAPE_MINIMUM,
                window: WT_G5000_PFDAirspeedIndicator.TAPE_WINDOW,
                majorTick: WT_G5000_PFDAirspeedIndicator.TAPE_MAJOR_TICK,
                minorTickFactor: WT_G5000_PFDAirspeedIndicator.TAPE_MINOR_TICK_FACTOR
            },
            trendLookahead: WT_G5000_PFDAirspeedIndicator.TREND_LOOKAHEAD,
            trendThreshold: WT_G5000_PFDAirspeedIndicator.TREND_THRESHOLD,
            machDisplayThreshold: WT_G5000_PFDAirspeedIndicator.MACH_DISPLAY_THRESHOLD,
            //redStrip: new WT_G5000_PFDAirspeedIndicatorFlapsStripDefinition(this.instrument.airplane, [40, 40, 40, 40], [140, 128, 120, 104]),
            //yellowStrip: new WT_G5000_PFDAirspeedIndicatorFlapsStripDefinition(this.instrument.airplane, [140, 128, 120, 104], [148, 135, 127, 110]),
            redStrip: new WT_G5000_PFDAirspeedIndicatorAoAStripDefinition(this._model, this._getRedStripMin(), Infinity),
            yellowStrip: new WT_G5000_PFDAirspeedIndicatorAoAStripDefinition(this._model, this._getYellowStripMin(), this._getRedStripMin()),
            barberStrip: new WT_G5000_PFDAirspeedIndicatorBarberStripDefinition(this._model)
        });
        return htmlElement;
    }
}
WT_G5000_PFDAirspeedIndicator.TAPE_MINIMUM = 40;
WT_G5000_PFDAirspeedIndicator.TAPE_WINDOW = 80;
WT_G5000_PFDAirspeedIndicator.TAPE_MAJOR_TICK = 10;
WT_G5000_PFDAirspeedIndicator.TAPE_MINOR_TICK_FACTOR = 1;
WT_G5000_PFDAirspeedIndicator.TREND_LOOKAHEAD = 10;
WT_G5000_PFDAirspeedIndicator.TREND_THRESHOLD = 1;
WT_G5000_PFDAirspeedIndicator.MACH_DISPLAY_THRESHOLD = 0.4;
WT_G5000_PFDAirspeedIndicator.STRIP_YELLOW_AOA_NORM_MIN = 0.7;
WT_G5000_PFDAirspeedIndicator.STRIP_RED_AOA_NORM_MIN = 0.9;

class WT_G5000_PFDAirspeedIndicatorModel extends WT_G3x5_PFDAirspeedIndicatorModel {
    constructor(airplane, airspeedSensor, speedBugCollection) {
        super(airplane, airspeedSensor, speedBugCollection);

        this._aoaCoefSmoother = new WT_ExponentialSmoother(WT_G5000_PFDAirspeedIndicatorModel.AOA_SMOOTHING_CONSTANT);
        this._aoaCoef = 0;
        this._lastAoACoefTime = 0;

        this._minSpeed = WT_Unit.KNOT.createNumber(0);
        this._maxSpeed = WT_Unit.KNOT.createNumber(0);

        this._tempFoot = WT_Unit.FOOT.createNumber(0);
        this._vmoKey = [0];
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get refSpeed() {
        return !this._airplane.autopilot.isSpeedReferenceMach() ? this._refSpeed.readonly() : null;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get refMach() {
        return this._airplane.autopilot.isSpeedReferenceMach() ? this._refMach : null;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get minSpeed() {
        return this._minSpeed.readonly();
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get maxSpeed() {
        return this._maxSpeed.readonly();
    }

    /**
     *
     * @param {Number} aoa
     * @param {WT_NumberUnit} [reference]
     * @returns {WT_NumberUnit}
     */
    aoaToIAS(aoa, reference) {
        if (this.airplane.sensors.isOnGround()) {
            return null;
        }

        let value = Math.sqrt(this._aoaCoef / (aoa - WT_G5000_PFDAirspeedIndicatorModel.AOA_ZERO_LIFT));
        return reference ? reference.set(value, WT_Unit.KNOT) : WT_Unit.KNOT.createNumber(value);
    }

    _updateAoACoef() {
        if (!this.airplane.sensors.isOnGround()) {
            let time = Date.now() / 1000;
            let dt = time - this._lastAoACoefTime;
            let ias = this.ias.asUnit(WT_Unit.KNOT);
            let vSquared = ias * ias;
            let aoa = this.airplane.sensors.aoa();
            let coef = (aoa - WT_G5000_PFDAirspeedIndicatorModel.AOA_ZERO_LIFT) * vSquared;
            this._aoaCoef = this._aoaCoefSmoother.next(coef, dt);
            this._lastAoACoefTime = time;
        }
    }

    _updateMinSpeed() {
        // TODO: implement minimum speed
    }

    _updateMaxSpeed() {
        let pressureAlt = this._airplane.environment.pressureAltitude(this._tempFoot);
        let feet = pressureAlt.number;
        if (feet < this._airplane.references.crossover.asUnit(WT_Unit.FOOT)) {
            this._vmoKey[0] = feet;
            this._airplane.references.Vmo.get(this._vmoKey, this._maxSpeed);
        } else {
            this._airplane.sensors.machToIAS(this._airplane.references.Mmo, this._maxSpeed);
        }
    }

    update() {
        super.update();

        this._updateAoACoef();
        this._updateMinSpeed();
        this._updateMaxSpeed();
    }
}
WT_G5000_PFDAirspeedIndicatorModel.AOA_SMOOTHING_CONSTANT = 5;
WT_G5000_PFDAirspeedIndicatorModel.AOA_ZERO_LIFT = -3;

class WT_G5000_PFDAirspeedIndicatorFlapsStripDefinition extends WT_G3x5_PFDAirspeedIndicatorStripDefinition {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {Number[]} min
     * @param {Number[]} max
     */
    constructor(airplane, min, max) {
        super();

        this._airplane = airplane;
        this._min = min;
        this._max = max
    }

    /**
     * @readonly
     * @type {Number}
     */
    get min() {
        return this._min[this._airplane.controls.flapsPosition()];
    }

    /**
     * @readonly
     * @type {Number}
     */
    get max() {
        return this._max[this._airplane.controls.flapsPosition()];
    }
}

class WT_G5000_PFDAirspeedIndicatorBarberStripDefinition extends WT_G3x5_PFDAirspeedIndicatorStripDefinition {
    /**
     * @param {WT_G5000_PFDAirspeedIndicatorModel} model
     */
    constructor(model) {
        super();

        this._model = model;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get min() {
        return Math.round(this._model.maxSpeed.asUnit(WT_Unit.KNOT));
    }

    /**
     * @readonly
     * @type {Number}
     */
    get max() {
        return Infinity;
    }
}

class WT_G5000_PFDAirspeedIndicatorAoAStripDefinition extends WT_G3x5_PFDAirspeedIndicatorStripDefinition {
    /**
     * @param {WT_G5000_PFDAirspeedIndicatorModel} model
     */
    constructor(model, minAoA, maxAoA) {
        super();

        this._model = model;
        this._minAoA = minAoA;
        this._maxAoA = maxAoA;

        this._tempKnot = WT_Unit.KNOT.createNumber(0);
    }

    /**
     * @readonly
     * @type {Number}
     */
    get min() {
        let speed = this._model.aoaToIAS(this._maxAoA, this._tempKnot);
        return speed ? Math.round(speed.number) : 0;
    }

    /**
     * @readonly
     * @type {Number}
     */
     get max() {
        let speed = this._model.aoaToIAS(this._minAoA, this._tempKnot);
        return speed ? Math.round(speed.number) : 0;
    }
}

class WT_G5000_PFDAirspeedIndicatorHTMLElement extends WT_G3x5_PFDAirspeedIndicatorHTMLElement {
    constructor() {
        super();

        this._isRefSpeedVisible = false;

        this._initRefKnotsFormatter();
    }

    _getTemplate() {
        return WT_G5000_PFDAirspeedIndicatorHTMLElement.TEMPLATE;
    }

    _initRefKnotsFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
        this._refKnotsFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                _numberClassList: [],
                _unitClassList: [WT_G5000_PFDAirspeedIndicatorHTMLElement.UNIT_CLASS],

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

    _createIASDigitEntry(container) {
        return {
            digit: container.querySelector(`.digit`),
            top: new WT_CachedElement(container.querySelector(`.topDigit`)),
            middle: new WT_CachedElement(container.querySelector(`.middleDigit`)),
            bottom: new WT_CachedElement(container.querySelector(`.bottomDigit`))
        };
    }

    _initSpeedBugRecycler() {
        /**
         * @type {WT_HTMLElementRecycler<WT_G3x5_PFDAirspeedIndicatorSpeedBug>}
         */
        this._speedBugRecycler = new WT_G3x5_PFDAirspeedIndicatorSpeedBugRecycler(this._speedBugContainer);
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._tape = this.shadowRoot.querySelector(`#tape`);
        this._tapeMajorTickLayer = this.shadowRoot.querySelector(`#majorticks`);
        this._tapeLabelLayer = this.shadowRoot.querySelector(`#labels`);
        this._tapeMinorTickLayer = this.shadowRoot.querySelector(`#minorticks`);

        this._barberStrip = new WT_CachedElement(this.shadowRoot.querySelector(`#barberstrip`));
        this._yellowStrip = new WT_CachedElement(this.shadowRoot.querySelector(`#yellowstrip`));
        this._redStrip = new WT_CachedElement(this.shadowRoot.querySelector(`#redstrip`));

        this._trend = new WT_CachedElement(this.shadowRoot.querySelector(`#trend`));

        this._refSpeed = new WT_CachedElement(this.shadowRoot.querySelector(`#refspeed`));
        this._refSpeedBugContainer = this.shadowRoot.querySelector(`#refspeedbugcontainer`);
        this._refSpeedBug = new WT_CachedElement(this.shadowRoot.querySelector(`#refspeedbug`));

        this._iasDigits = [];
        this._iasDigits.push(this._createIASDigitEntry(this.shadowRoot.querySelector(`#iasdigitcontainer3`)));
        this._iasDigits.push(this._createIASDigitEntry(this.shadowRoot.querySelector(`#iasdigitcontainer2`)));
        this._iasDigits.push(this._createIASDigitEntry(this.shadowRoot.querySelector(`#iasdigitcontainer1`)));

        this._mach = new WT_CachedElement(this.shadowRoot.querySelector(`#mach`));

        this._speedBugContainer = this.shadowRoot.querySelector(`#speedbugcontainer`);

        this._initSpeedBugRecycler();
    }

    /**
     *
     * @param {WT_SpeedBug} bug
     * @returns {String}
     */
     _getSpeedBugLabel(bug) {
        return WT_G5000_PFDAirspeedIndicatorHTMLElement.SPEED_BUG_LABELS[`v${bug.name}`];
    }

    /**
     *
     * @param {WT_SpeedBug} bug
     * @returns {WT_G3x5_PFDAirspeedIndicatorSpeedBug}
     */
    _getSpeedBugHTMLElement(bug) {
        let htmlElement = this._speedBugRecycler.request();
        htmlElement.setLabel(this._getSpeedBugLabel(bug));
        return htmlElement;
    }

    _moveTape(tapePos) {
        let translate = Math.max(0, 100 - tapePos * 100);
        this._tape.style.transform = `translateY(${translate}%)`;
    }

    _showStrip(strip, value) {
        strip.setAttribute("show", `${value}`);
    }

    _moveStrip(strip, minPos, maxPos) {
        strip.setAttribute("style", `top: ${maxPos * 100}%; height: ${(minPos - maxPos) * 100}%;`);
    }

    _updateStrips() {
        this._updateStrip(this._barberStrip, this._context.barberStrip);
        this._updateStrip(this._yellowStrip, this._context.yellowStrip);
        this._updateStrip(this._redStrip, this._context.redStrip);
    }

    _showTrend(value) {
        this._trend.setAttribute("show", `${value}`);
    }

    _setTrendLength(trend) {
        this._trend.element.style.transform = `scaleY(${Math.max(-this._tapeLength / 2, Math.min(this._tapeLength / 2, -trend))})`;
    }

    _showRefSpeed(value) {
        this._wrapper.setAttribute("show-refspeed", `${value}`);
        this._isRefSpeedVisible = value;
    }

    _setRefSpeedDisplay(speed, isMach) {
        if (isMach) {
            this._refSpeed.innerHTML = `M ${speed.toFixed(3).replace(/^0\./, ".")}`;
        } else {
            this._refSpeed.innerHTML = this._refKnotsFormatter.getFormattedHTML(speed, WT_Unit.KNOT);
        }
    }

    _moveRefSpeedBug(tapePos) {
        let translate = Math.max(-40, Math.min(50, (tapePos - 0.5) * 100));
        this._refSpeedBugContainer.setAttribute("style", `transform: translateY(${translate}%) rotateX(0deg);`);
    }

    _showMach(value) {
        this._wrapper.setAttribute("show-mach", `${value}`);
    }

    _setMachDisplay(mach) {
        this._mach.textContent = `M ${mach.toFixed(3).replace(/^0\./, ".")}`;
    }

    _setTrendWarning(value) {
        this._wrapper.setAttribute("trend-warning", `${value}`);
    }

    _isAutopilotOverspeedProtectionActive() {
        let autopilot = this._context.model.airplane.autopilot;
        return autopilot.isMasterActive() && (autopilot.isFLCActive() || autopilot.isVSActive() || autopilot.isPitchHoldActive());
    }

    _setMaxSpeedWarning(value) {
        this._wrapper.setAttribute("maxspeed-warning", `${value}`);
        this._wrapper.setAttribute("ap-overspeed", `${value && this._isAutopilotOverspeedProtectionActive()}`);
    }

    _setMinSpeedWarning(value) {
        //this._wrapper.setAttribute("minspeed-warning", `${value}`);
    }

    /**
     *
     * @param {{bug:WT_SpeedBug, htmlElement:WT_G3x5_PFDAirspeedIndicatorSpeedBug}} entry
     * @param {Boolean} value
     */
    _showSpeedBug(entry, value) {
        entry.htmlElement.show(value);
    }

    /**
     *
     * @param {{bug:WT_SpeedBug, htmlElement:WT_G3x5_PFDAirspeedIndicatorSpeedBug}} entry
     * @param {Number} tapePos
     */
    _moveSpeedBug(entry, tapePos) {
        let translate = Math.max(this._isRefSpeedVisible ? -40 : -50, Math.min(50, (tapePos - 0.5) * 100));
        entry.htmlElement.setAttribute("style", `transform: translateY(${translate}%) rotateX(0deg);`);
    }
}
WT_G5000_PFDAirspeedIndicatorHTMLElement.UNIT_CLASS = "unit";
WT_G5000_PFDAirspeedIndicatorHTMLElement.SPEED_BUG_LABELS = {
    v1: "1",
    vr: "R",
    v2: "2",
    vfto: "FTO",
    vref: "RF",
    vapp: "AP"
};
WT_G5000_PFDAirspeedIndicatorHTMLElement.SPEED_BUG_CLASS = "speedBug";
WT_G5000_PFDAirspeedIndicatorHTMLElement.NAME = "wt-pfd-airspeedindicator";
WT_G5000_PFDAirspeedIndicatorHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDAirspeedIndicatorHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            transform: rotateX(0deg);
        }
            #maxspeedcontainer {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 80%;
                height: 8%;
                background-color: var(--wt-g3x5-amber);
                display: none;
            }
            #wrapper[ap-overspeed="true"] #maxspeedcontainer {
                display: block;
            }
                #maxspeed {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    color: black;
                    font-weight: bold;
                    font-size: var(--airspeedindicator-maxspeed-font-size, 0.8em);
                }
            #tapecontainer {
                position: absolute;
                left: 0%;
                top: 8%;
                width: 80%;
                height: 82.8%;
                background-color: rgba(0, 0, 0, var(--airspeedindicator-tape-bg-alpha, 0.2));
                border-radius: var(--airspeedindicator-tape-bg-border-radius, 10px) 0 0 var(--airspeedindicator-tape-bg-border-radius, 10px);
            }
            #wrapper[show-mach="true"] #tapecontainer {
                border-radius: var(--airspeedindicator-tape-bg-border-radius, 10px) 0 0 0;
            }
                #tapeclip {
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                    height: 100%;
                }
                    #tape {
                        position: absolute;
                        bottom: 50%;
                        width: 100%;
                    }
                        #strips {
                            position: absolute;
                            right: 0%;
                            width: var(--airspeedindicator-minortick-width, 12%);
                            height: 100%;
                        }
                            .strip {
                                position: absolute;
                                left: 0%;
                                width: 100%;
                                display: none;
                            }
                            .strip[show="true"] {
                                display: block;
                            }
                            #barberstrip {
                                background: repeating-linear-gradient(135deg, red, red 6px, white 6px, white 12px);
                            }
                            #yellowstrip {
                                background-color: var(--wt-g3x5-amber);
                            }
                            #redstrip {
                                background-color: red;
                            }
                        #minorticks {
                            position: absolute;
                            right: 0%;
                            width: var(--airspeedindicator-minortick-width, 12%);
                            height: 100%;
                            stroke: white;
                            stroke-width: var(--airspeedindicator-minortick-stroke-width, 2px);
                        }
                        #majorticks {
                            position: absolute;
                            right: 0%;
                            width: var(--airspeedindicator-majortick-width, 24%);
                            height: 100%;
                            stroke: white;
                            stroke-width: var(--airspeedindicator-majortick-stroke-width, 2px);
                        }
                        #labels {
                            position: absolute;
                            right: calc(var(--airspeedindicator-majortick-width, 20%) + var(--airspeedindicator-label-margin-right, 0.5em));
                            width: calc(100% - var(--airspeedindicator-majortick-width, 20%) + var(--airspeedindicator-label-margin-right, 0.5em));
                            height: 100%;
                            font-size: var(--airspeedindicator-label-font-size, 1em);
                            fill: white;
                            text-anchor: end;
                        }
                #refspeedbugclip {
                    position: absolute;
                    top: 0%;
                    height: 100%;
                    left: 0%;
                    width: 100%;
                    overflow-y: hidden;
                }
                    #refspeedbugcontainer {
                        position: absolute;
                        right: 0%;
                        top: 0%;
                        width: var(--airspeedindicator-minortick-width, 12%);
                        height: 100%;
                        transform: rotateX(0deg);
                    }
                        #refspeedbug {
                            position: absolute;
                            left: 0%;
                            top: 50%;
                            width: 100%;
                            height: calc(var(--airspeedindicator-ias-font-size, 1.25em) * 0.7);
                            transform: translateY(-50%);
                            fill: var(--wt-g3x5-lightblue);
                            stroke: #299aa0;
                            stroke-width: 5;
                            display: none;
                        }
                        #wrapper[show-refspeed="true"] #refspeedbug {
                            display: block;
                        }
                #refspeedcontainer {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 10%;
                    background-color: var(--wt-g3x5-bggray);
                    border-radius: var(--airspeedindicator-tape-bg-border-radius, 10px) 0 0 0;
                    display: none;
                }
                #wrapper[show-refspeed="true"] #refspeedcontainer {
                    display: block;
                }
                    #refspeediconsvg {
                        position: absolute;
                        left: 7.5%;
                        top: 25%;
                        width: 10%;
                        height: 50%;
                    }
                        #refspeedicon {
                            fill: var(--wt-g3x5-lightblue);
                        }
                    #refspeed {
                        position: absolute;
                        left: 20%;
                        top: 50%;
                        width: 80%;
                        transform: translateY(-50%);
                        text-align: center;
                        color: var(--wt-g3x5-lightblue);
                        font-size: var(--airspeedindicator-refspeed-font-size, 0.8em);
                    }
                #trendcontainer {
                    position: absolute;
                    left: calc(100% - var(--airspeedindicator-trend-width, 8%) / 2);
                    top: 0%;
                    width: var(--airspeedindicator-trend-width, 8%);
                    height: 100%;
                }
                    #trendcontainer svg {
                        width: 100%;
                        height: 100%;
                    }
                        #trend {
                            fill: var(--wt-g3x5-purple);
                            stroke: white;
                            stroke-width: 1px;
                            transform-origin: 50% 50%;
                            display: none;
                        }
                        #trend[show="true"] {
                            display: inherit;
                        }
                #iasdisplaycontainer {
                    position: absolute;
                    right: calc(var(--airspeedindicator-minortick-width, 12%) / 2);
                    width: calc(100% - var(--airspeedindicator-minortick-width, 12%) / 2);
                    top: 50%;
                    height: calc(var(--airspeedindicator-ias-font-size, 1.25em) * 1.2 * 2);
                    transform: translateY(-50%);
                }
                    #iasdisplaybg {
                        width: 100%;
                        height: 100%;
                        fill: var(--wt-g3x5-bggray);
                        stroke: white;
                        stroke-width: 1px;
                    }
                    #wrapper[trend-warning="true"][maxspeed-warning="false"] #iasdisplaybg {
                        fill: var(--wt-g3x5-amber);
                        stroke-width: 0px;
                    }
                    #wrapper[maxspeed-warning="true"] #iasdisplaybg {
                        fill: red;
                        stroke-width: 0px;
                    }
                    #iasdisplay {
                        position: absolute;
                        right: 12%;
                        top: 0%;
                        width: 83%;
                        height: 100%;
                    }
                        .iasDigitContainer {
                            position: absolute;
                            width: 33.3%;
                            text-align: center;
                            overflow: hidden;
                        }
                        #iasdigitcontainer1 {
                            left: 0%;
                            top: 27.5%;
                            height: 45%;
                        }
                        #iasdigitcontainer2 {
                            left: 33.3%;
                            top: 27.5%;
                            height: 45%;
                        }
                        #iasdigitcontainer3 {
                            left: 66.6%;
                            top: 7.5%;
                            height: 85%;
                        }
                            .digit {
                                position: absolute;
                                left: 0%;
                                top: 50%;
                                width: 100%;
                                height: 3em;
                                transform: translateY(-50%);
                                font-size: var(--airspeedindicator-ias-font-size, 1.25em);
                                text-anchor: middle;
                                fill: white;
                            }
                            #wrapper[trend-warning="true"][maxspeed-warning="false"] .digit {
                                fill: black;
                            }
            #speedbugcontainer {
                position: absolute;
                right: 0%;
                top: 8%;
                width: 18%;
                height: 82.8%;
            }
                #speedbugcontainer wt-pfd-airspeedindicator-speedbug {
                    position: absolute;
                    top: 0%;
                    left: 0%;
                    width: 100%;
                    height: 100%;
                    font-family: "Roboto-Condensed";
                    font-size: var(--airspeedindicator-speedbug-font-size, 0.67em);
                    color: var(--wt-g3x5-lightblue);
                    transform: rotateX(0deg);
                }
            #machcontainer {
                position: absolute;
                bottom: 0%;
                left: 0%;
                height: 9.2%;
                width: 80%;
                background-color: var(--wt-g3x5-bggray);
                border-radius: 0 0 0 var(--airspeedindicator-tape-bg-border-radius, 10px);
                display: none;
            }
            #wrapper[show-mach="true"] #machcontainer {
                display: block;
            }
            #wrapper[trend-warning="true"][maxspeed-warning="false"] #machcontainer {
                background-color: var(--wt-g3x5-amber);
            }
            #wrapper[maxspeed-warning="true"] #machcontainer {
                background-color: red;
            }
                #mach {
                    position: absolute;
                    left: 0%;
                    width: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    text-align: center;
                    color: white;
                    font-size: var(--airspeedindicator-mach-font-size, 0.8em);
                }
                #wrapper[trend-warning="true"][maxspeed-warning="false"] #mach {
                    color: black;
                }

        .${WT_G5000_PFDAirspeedIndicatorHTMLElement.UNIT_CLASS} {
            font-size: var(--airspeedindicator-refspeed-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="maxspeedcontainer">
            <div id="maxspeed">MAXSPD</div>
        </div>
        <div id="tapecontainer">
            <div id="tapeclip">
                <div id="tape">
                    <div id="strips">
                        <div id="yellowstrip" class="strip"></div>
                        <div id="redstrip" class="strip"></div>
                        <div id="barberstrip" class="strip"></div>
                    </div>
                    <svg id="minorticks" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                    <svg id="majorticks" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                    <svg id="labels"></svg>
                </div>
            </div>
            <div id="refspeedbugclip">
                <div id="refspeedbugcontainer">
                    <svg id="refspeedbug" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 0 0 h 100 v 100 h -100 v -25 L 66.67 50 L 0 25 Z" />
                    </svg>
                </div>
            </div>
            <div id="refspeedcontainer">
                <svg id="refspeediconsvg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path id="refspeedicon" d="M 0 0 h 100 v 100 h -100 v -25 L 66.67 50 L 0 25 Z" />
                </svg>
                <div id="refspeed"></div>
            </div>
            <div id="trendcontainer">
                <svg>
                    <rect id="trend" x="0%" y="50%" width="100%" vector-effect="non-scaling-stroke" />
                </svg>
            </div>
            <div id="iasdisplaycontainer">
                <svg id="iasdisplaybg" viewbox="0 0 100 100" preserveAspectRatio="none">
                    <path vector-effect="non-scaling-stroke" d="M 5 25 L 55 25 L 55 5 L 88 5 L 88 42.5 L 100 50 L 88 57.5 L 88 95 L 55 95 L 55 75 L 5 75 Z" />
                </svg>
                <div id="iasdisplay">
                    <div id="iasdigitcontainer1" class="iasDigitContainer">
                        <svg class="digit">
                            <text class="topDigit" alignment-baseline="central" x="50%" y="16.67%">1</text>
                            <text class="middleDigit" alignment-baseline="central" x="50%" y="50%">0</text>
                            <text class="bottomDigit" alignment-baseline="central" x="50%" y="83.33%">9</text>
                        </svg>
                    </div>
                    <div id="iasdigitcontainer2" class="iasDigitContainer">
                        <svg class="digit">
                            <text class="topDigit" alignment-baseline="central" x="50%" y="16.67%">1</text>
                            <text class="middleDigit" alignment-baseline="central" x="50%" y="50%">0</text>
                            <text class="bottomDigit" alignment-baseline="central" x="50%" y="83.33%">9</text>
                        </svg>
                    </div>
                    <div id="iasdigitcontainer3" class="iasDigitContainer">
                        <svg class="digit">
                            <text class="topDigit" alignment-baseline="central" x="50%" y="16.67%">1</text>
                            <text class="middleDigit" alignment-baseline="central" x="50%" y="50%">0</text>
                            <text class="bottomDigit" alignment-baseline="central" x="50%" y="83.33%">9</text>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
        <div id="speedbugcontainer">
        </div>
        <div id="machcontainer">
            <div id="mach">
            </div>
        </div>
    </div>
`;

customElements.define(WT_G5000_PFDAirspeedIndicatorHTMLElement.NAME, WT_G5000_PFDAirspeedIndicatorHTMLElement);