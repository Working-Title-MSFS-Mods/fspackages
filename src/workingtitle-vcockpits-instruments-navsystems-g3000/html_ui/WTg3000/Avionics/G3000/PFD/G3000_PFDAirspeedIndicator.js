class WT_G3000_PFDAirspeedIndicator extends WT_G3x5_PFDAirspeedIndicator {
    _createSpeedBugCollection() {
        let collection = new WT_SpeedBugCollection("PFD");
        collection.addBug("r", this.instrument.airplane.references.Vr);
        collection.addBug("x", this.instrument.airplane.references.Vx);
        collection.addBug("y", this.instrument.airplane.references.Vy);
        collection.addBug("app", this.instrument.airplane.references.Vapp);
        return collection;
    }

    _createModel() {
        return new WT_G3000_PFDAirspeedIndicatorModel(this.instrument.airplane, this._createSpeedBugCollection());
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDAirspeedIndicatorHTMLElement();
        htmlElement.setContext({
            model: this._model,
            scale: {
                min: WT_G3000_PFDAirspeedIndicator.TAPE_MINIMUM,
                window: WT_G3000_PFDAirspeedIndicator.TAPE_WINDOW,
                majorTick: WT_G3000_PFDAirspeedIndicator.TAPE_MAJOR_TICK,
                minorTickFactor: WT_G3000_PFDAirspeedIndicator.TAPE_MINOR_TICK_FACTOR
            },
            trendLookahead: WT_G3000_PFDAirspeedIndicator.TREND_LOOKAHEAD,
            trendThreshold: WT_G3000_PFDAirspeedIndicator.TREND_THRESHOLD,
            machDisplayThreshold: WT_G3000_PFDAirspeedIndicator.MACH_DISPLAY_THRESHOLD,
            redStrip: new WT_G3x5_PFDAirspeedIndicatorConstantStripDefinition(20, 65),
            whiteStrip: new WT_G3x5_PFDAirspeedIndicatorConstantStripDefinition(65, 122),
            greenStrip: new WT_G3x5_PFDAirspeedIndicatorConstantStripDefinition(122, 266),
            barberStrip: new WT_G3x5_PFDAirspeedIndicatorConstantStripDefinition(266, Infinity)
        });
        return htmlElement;
    }
}
WT_G3000_PFDAirspeedIndicator.TAPE_MINIMUM = 20;
WT_G3000_PFDAirspeedIndicator.TAPE_WINDOW = 60;
WT_G3000_PFDAirspeedIndicator.TAPE_MAJOR_TICK = 10;
WT_G3000_PFDAirspeedIndicator.TAPE_MINOR_TICK_FACTOR = 2;
WT_G3000_PFDAirspeedIndicator.TREND_LOOKAHEAD = 6;
WT_G3000_PFDAirspeedIndicator.TREND_THRESHOLD = 1;
WT_G3000_PFDAirspeedIndicator.MACH_DISPLAY_THRESHOLD = 0.3;

class WT_G3000_PFDAirspeedIndicatorModel extends WT_G3x5_PFDAirspeedIndicatorModel {
    constructor(airplane, speedBugCollection) {
        super(airplane, speedBugCollection);

        this._minSpeed = WT_Unit.KNOT.createNumber(0);
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} minSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get minSpeed() {
        return this._minSpeed.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} maxSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get maxSpeed() {
        return this.airplane.references.Vmo;
    }

    _updateMinSpeed() {
        this._minSpeed.set(WT_G3000_PFDAirspeedIndicatorModel.MIN_SPEED[this._airplane.controls.flapsPosition()]);
    }

    update() {
        super.update();

        this._updateMinSpeed();
    }
}
WT_G3000_PFDAirspeedIndicatorModel.MIN_SPEED = [
    WT_Unit.KNOT.createNumber(88),
    WT_Unit.KNOT.createNumber(84),
    WT_Unit.KNOT.createNumber(74)
];

class WT_G3000_PFDAirspeedIndicatorHTMLElement extends WT_G3x5_PFDAirspeedIndicatorHTMLElement {
    constructor() {
        super();

        this._isRefSpeedVisible = false;
    }

    _getTemplate() {
        return WT_G3000_PFDAirspeedIndicatorHTMLElement.TEMPLATE;
    }

    _createIASDigitEntry(container) {
        return {
            digit: container.querySelector(`.digit`),
            top: new WT_CachedSVGTextElement(container.querySelector(`.topDigit`)),
            middle: new WT_CachedSVGTextElement(container.querySelector(`.middleDigit`)),
            bottom: new WT_CachedSVGTextElement(container.querySelector(`.bottomDigit`))
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
        this._greenStrip = new WT_CachedElement(this.shadowRoot.querySelector(`#greenstrip`));
        this._whiteStrip = new WT_CachedElement(this.shadowRoot.querySelector(`#whitestrip`));
        this._redStrip = new WT_CachedElement(this.shadowRoot.querySelector(`#redstrip`));

        this._trend = new WT_CachedElement(this.shadowRoot.querySelector(`#trend`));

        this._refSpeed = new WT_CachedElement(this.shadowRoot.querySelector(`#refspeed .value`));
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
        return WT_G3000_PFDAirspeedIndicatorHTMLElement.SPEED_BUG_LABELS[`v${bug.name}`];
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
        this._updateStrip(this._greenStrip, this._context.greenStrip);
        this._updateStrip(this._whiteStrip, this._context.whiteStrip);
        this._updateStrip(this._redStrip, this._context.redStrip);
    }

    _showRefSpeed(value) {
        this._wrapper.setAttribute("show-refspeed", `${value}`);
        this._isRefSpeedVisible = value;
    }

    _moveRefSpeedBug(tapePos) {
        let translate = Math.max(-40, Math.min(50, (tapePos - 0.5) * 100));
        this._refSpeedBugContainer.setAttribute("style", `transform: translateY(${translate}%);`);
    }

    _showMach(value) {
        this._wrapper.setAttribute("show-mach", `${value}`);
    }

    _setTrendWarning(value) {
        this._wrapper.setAttribute("trend-warning", `${value}`);
    }

    _setMaxSpeedWarning(value) {
        this._wrapper.setAttribute("maxspeed-warning", `${value}`);
    }

    _setMinSpeedWarning(value) {
        this._wrapper.setAttribute("minspeed-warning", `${value}`);
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
        entry.htmlElement.setAttribute("style", `transform: translateY(${translate}%);`);
    }
}
WT_G3000_PFDAirspeedIndicatorHTMLElement.SPEED_BUG_LABELS = {
    vr: "R",
    vx: "X",
    vy: "Y",
    vapp: "AP"
};
WT_G3000_PFDAirspeedIndicatorHTMLElement.SPEED_BUG_CLASS = "speedBug";
WT_G3000_PFDAirspeedIndicatorHTMLElement.NAME = "wt-pfd-airspeedindicator";
WT_G3000_PFDAirspeedIndicatorHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDAirspeedIndicatorHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #minspeedcontainer {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 80%;
                height: 8%;
                background-color: var(--wt-g3x5-amber);
                display: none;
            }
            #wrapper[minspeed-warning="true"] #minspeedcontainer {
                display: block;
            }
                #minspeed {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    color: black;
                    font-weight: bold;
                    font-size: var(--airspeedindicator-minspeed-font-size, 0.8em);
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
                            #greenstrip {
                                background-color: var(--wt-g3x5-green);
                            }
                            #whitestrip {
                                background-color: white;
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
                        left: 10%;
                        top: 25%;
                        width: 10%;
                        height: 50%;
                    }
                        #refspeedicon {
                            fill: var(--wt-g3x5-lightblue);
                        }
                    #refspeed {
                        position: absolute;
                        left: 62.5%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        text-align: center;
                        color: var(--wt-g3x5-lightblue);
                        font-size: var(--airspeedindicator-refspeed-font-size, 0.8em);
                    }
                    #refspeed .unit {
                        font-size: var(--airspeedindicator-refspeed-unit-font-size, 0.75em);
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
                        }
                        #trend[hide="true"] {
                            display: none;
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
    </style>
    <div id="wrapper">
        <div id="minspeedcontainer">
            <div id="minspeed">MINSPD</div>
        </div>
        <div id="tapecontainer">
            <div id="tapeclip">
                <div id="tape">
                    <div id="strips">
                        <div id="greenstrip" class="strip"></div>
                        <div id="whitestrip" class="strip"></div>
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
                <div id="refspeed">
                    <span class="value"></span><span class="unit">KT</span>
                </div>
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

customElements.define(WT_G3000_PFDAirspeedIndicatorHTMLElement.NAME, WT_G3000_PFDAirspeedIndicatorHTMLElement);