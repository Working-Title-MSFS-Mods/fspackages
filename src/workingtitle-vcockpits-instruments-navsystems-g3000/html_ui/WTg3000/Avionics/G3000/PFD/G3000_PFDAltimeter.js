class WT_G3000_PFDAltimeter extends WT_G3x5_PFDAltimeter {
    _createModel() {
        return new WT_G3x5_PFDAltimeterModel(this.instrument.airplane, 1);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDAltimeterHTMLElement();
        htmlElement.setContext({
            model: this._model,
            altScale: {
                window: WT_G3000_PFDAltimeter.ALT_TAPE_WINDOW,
                majorTick: WT_G3000_PFDAltimeter.ALT_TAPE_MAJOR_TICK,
                minorTickFactor: WT_G3000_PFDAltimeter.ALT_TAPE_MINOR_TICK_FACTOR
            },
            trendLookahead: WT_G3000_PFDAltimeter.TREND_LOOKAHEAD,
            trendThreshold: WT_G3000_PFDAltimeter.TREND_THRESHOLD,
            vSpeedScale: {
                window: WT_G3000_PFDAltimeter.VS_WINDOW,
                majorTick: WT_G3000_PFDAltimeter.VS_MAJOR_TICK,
                minorTickFactor: WT_G3000_PFDAltimeter.VS_MINOR_TICK_FACTOR
            },
            vSpeedThreshold: WT_G3000_PFDAltimeter.VS_THRESHOLD
        });
        return htmlElement;
    }
}
WT_G3000_PFDAltimeter.ALT_TAPE_WINDOW = 1000;
WT_G3000_PFDAltimeter.ALT_TAPE_MAJOR_TICK = 100;
WT_G3000_PFDAltimeter.ALT_TAPE_MINOR_TICK_FACTOR = 5;
WT_G3000_PFDAltimeter.TREND_LOOKAHEAD = 6;
WT_G3000_PFDAltimeter.TREND_THRESHOLD = 20;
WT_G3000_PFDAltimeter.VS_WINDOW = 9000;
WT_G3000_PFDAltimeter.VS_MAJOR_TICK = 2000;
WT_G3000_PFDAltimeter.VS_MINOR_TICK_FACTOR = 2;
WT_G3000_PFDAltimeter.VS_THRESHOLD = 100;

class WT_G3000_PFDAltimeterHTMLElement extends WT_G3x5_PFDAltimeterHTMLElement {
    /**
     *
     * @returns {WT_G3000_PFDAltimeterAltitudeHTMLElement}
     */
     _createAltitudeHTMLElement() {
         return new WT_G3000_PFDAltimeterAltitudeHTMLElement();
    }
}
WT_G3000_PFDAltimeterHTMLElement.NAME = "wt-pfd-altimeter";

customElements.define(WT_G3000_PFDAltimeterHTMLElement.NAME, WT_G3000_PFDAltimeterHTMLElement);

class WT_G3000_PFDAltimeterAltitudeHTMLElement extends WT_G3x5_PFDAltimeterAltitudeHTMLElement {
    constructor() {
        super();

        this._initMetersFormatter();
    }

    _getTemplate() {
        return WT_G3000_PFDAltimeterAltitudeHTMLElement.TEMPLATE;
    }

    _initMetersFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
        this._metersFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3000_PFDAltimeterAltitudeHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _createIndicatedAltitudeDigitEntry(container) {
        let minus = container.querySelector(`.minusDigit`);
        return {
            digit: container.querySelector(`.indicatedAltDigitGroup`),
            top: new WT_CachedSVGTextElement(container.querySelector(`.topDigit tspan`)),
            middle: new WT_CachedSVGTextElement(container.querySelector(`.middleDigit tspan`)),
            bottom: new WT_CachedSVGTextElement(container.querySelector(`.bottomDigit tspan`)),
            minus: minus ? new WT_CachedSVGTextElement(minus) : undefined
        };
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._tape = this.shadowRoot.querySelector(`#tape`);
        this._tapeMajorTickLayer = this.shadowRoot.querySelector(`#majorticks`);
        this._tapeLabelLayer = this.shadowRoot.querySelector(`#labels`);
        this._tapeMinorTickLayer = this.shadowRoot.querySelector(`#minorticks`);

        this._trend = new WT_CachedElement(this.shadowRoot.querySelector(`#trend`));

        this._selectedAltBig = new WT_CachedElement(this.shadowRoot.querySelector(`#selectedaltbig`));
        this._selectedAltSmall = new WT_CachedElement(this.shadowRoot.querySelector(`#selectedaltsmall`));
        this._selectedAltBugContainer = this.shadowRoot.querySelector(`#selectedaltbugcontainer`);
        this._selectedAltBug = new WT_CachedElement(this.shadowRoot.querySelector(`#selectedaltbug`));

        this._indicatedAltitudeDigits = [];
        this._indicatedAltitudeDigits.push(this._createIndicatedAltitudeDigitEntry(this.shadowRoot.querySelector(`#indicatedaltdigitcontainer0`)));
        this._indicatedAltitudeDigits.push(this._createIndicatedAltitudeDigitEntry(this.shadowRoot.querySelector(`#indicatedaltdigitcontainer1`)));
        this._indicatedAltitudeDigits.push(this._createIndicatedAltitudeDigitEntry(this.shadowRoot.querySelector(`#indicatedaltdigitcontainer2`)));
        this._indicatedAltitudeDigits.push(this._createIndicatedAltitudeDigitEntry(this.shadowRoot.querySelector(`#indicatedaltdigitcontainer3`)));

        this._baroNumber = new WT_CachedElement(this.shadowRoot.querySelector(`#baronumber`));
        this._baroUnit = new WT_CachedElement(this.shadowRoot.querySelector(`#barounit`));

        this._selectedAltMeters = new WT_CachedElement(this.shadowRoot.querySelector(`#selectedaltmeters`));
        this._indicatedAltMeters = new WT_CachedElement(this.shadowRoot.querySelector(`#indicatedaltmeters`));
    }

    _getAltString(number) {
        let rounded = Math.round(number);
        let isNegative = rounded < 0;
        let string = Math.abs(rounded).toFixed(0).padStart(3, "0");
        return (isNegative ? "−" : "") + string;
    }

    _updateTapeLabel(label, number) {
        let string = this._getAltString(number);
        let big = string.substring(0, string.length - 2);
        let small = string.substring(string.length - 2);
        label.innerHTML = `<tspan>${big}</tspan><tspan class="${WT_G3000_PFDAltimeterAltitudeHTMLElement.SMALL_DIGIT_CLASS}">${small}</tspan>`;
    }

    _moveTape(tapePos) {
        let translate = Math.max(0, 100 - tapePos * 100);
        this._tape.style.transform = `translateY(${translate}%)`;
    }

    _setIndicatedAltitudeSignPlace(place) {
        let index = (place >= 0) ? Math.max(2, place - 1) : -1;
        for (let i = 2; i < this._indicatedAltitudeDigits.length; i++) {
            let entry = this._indicatedAltitudeDigits[i];
            entry.minus.setAttribute("show", `${i === index}`);
        }
    }

    _showTrend(value) {
        this._trend.setAttribute("show", `${value}`);
    }

    _setTrendLength(trend) {
        this._trend.element.style.transform = `scaleY(${Math.max(-this._tapeLength / 2, Math.min(this._tapeLength / 2, -trend))})`;
    }

    _setSelectedAltitudeDisplay(number) {
        let string = this._getAltString(number);
        let big = string.substring(0, string.length - 2);
        let small = string.substring(string.length - 2);
        this._selectedAltBig.innerHTML = big;
        this._selectedAltSmall.innerHTML = small;
    }

    _moveSelectedAltitudeBug(tapePos) {
        let translate = Math.max(-50, Math.min(50, (tapePos - 0.5) * 100));
        this._selectedAltBugContainer.setAttribute("style", `transform: translateY(${translate}%);`);
    }

    _setBaroNumberText(text) {
        this._baroNumber.innerHTML = text;
    }

    _setBaroUnitText(text) {
        this._baroUnit.innerHTML = text;
    }

    _showMeters(value) {
        this._wrapper.setAttribute("show-meters", `${value}`);
    }

    _setIndicatedAltitudeMetersDisplay(altitude) {
        this._indicatedAltMeters.innerHTML = this._metersFormatter.getFormattedHTML(altitude, WT_Unit.METER);
    }

    _setSelectedAltitudeMetersDisplay(altitude) {
        this._selectedAltMeters.innerHTML = this._metersFormatter.getFormattedHTML(altitude, WT_Unit.METER);
    }
}
WT_G3000_PFDAltimeterAltitudeHTMLElement.SMALL_DIGIT_CLASS = "smallDigit";
WT_G3000_PFDAltimeterAltitudeHTMLElement.UNIT_CLASS = "unit";
WT_G3000_PFDAltimeterAltitudeHTMLElement.NAME = "wt-pfd-altimeter-altitude";
WT_G3000_PFDAltimeterAltitudeHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDAltimeterAltitudeHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #selectedaltcontainer {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 8%;
                background-color: var(--wt-g3x5-bggray);
                border-radius: 0 var(--altimeter-tape-bg-border-radius, 10px) 0 0;
            }
                #selectedalticonsvg {
                    position: absolute;
                    left: 7.5%;
                    top: 25%;
                    width: 7.5%;
                    height: 50%;
                }
                    #selectedalticon {
                        fill: var(--wt-g3x5-lightblue);
                    }
                #selectedalt {
                    position: absolute;
                    left: 60%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: var(--wt-g3x5-lightblue);
                    font-size: var(--altimeter-selectedalt-font-size, 1em);
                }
            #tapecontainer {
                position: absolute;
                left: 0%;
                top: 8%;
                width: 100%;
                height: 82.8%;
                background-color: rgba(0, 0, 0, var(--altimeter-tape-bg-alpha, 0.2));
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
                        #minorticks {
                            position: absolute;
                            left: 0%;
                            width: var(--altimeter-minortick-width, 12%);
                            height: 100%;
                            stroke: white;
                            stroke-width: var(--altimeter-minortick-stroke-width, 2px);
                        }
                        #majorticks {
                            position: absolute;
                            left: 0%;
                            width: var(--altimeter-majortick-width, 24%);
                            height: 100%;
                            stroke: white;
                            stroke-width: var(--altimeter-majortick-stroke-width, 2px);
                        }
                        #labels {
                            position: absolute;
                            right: var(--altimeter-label-margin-right, 0.25em);
                            width: calc(100% - var(--altimeter-majortick-width, 24%) - var(--altimeter-label-margin-right, 0.25em));
                            height: 100%;
                            font-size: var(--altimeter-label-font-size, 1em);
                            fill: white;
                            text-anchor: end;
                        }
                            .label {
                                dominant-baseline: middle;
                            }
                            .label tspan {
                                alignment-baseline: baseline;
                            }
                #selectedaltbugclip {
                    position: absolute;
                    top: 0%;
                    height: 100%;
                    left: 0%;
                    width: 100%;
                    overflow-y: hidden;
                }
                    #selectedaltbugcontainer {
                        position: absolute;
                        left: 0%;
                        top: 0%;
                        width: var(--altimeter-minortick-width, 12%);
                        height: 100%;
                    }
                        #selectedaltbug {
                            position: absolute;
                            left: 0%;
                            top: 50%;
                            width: 100%;
                            height: calc(var(--altimeter-indicatedalt-font-size, 1.25em) * 0.7);
                            transform: translateY(-50%);
                            fill: var(--wt-g3x5-lightblue);
                            stroke: #299aa0;
                            stroke-width: 5;
                        }
                #trendcontainer {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: var(--altimeter-trend-width, 6%);
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
                #selectedaltmeterscontainer {
                    position: absolute;
                    right: 5%;
                    top: 1px;
                    width: calc(95% - var(--altimeter-majortick-width, 24%));
                    height: calc(var(--altimeter-meters-font-size, 0.9em) * 1.2);
                    background-color: var(--wt-g3x5-bggray);
                    border-radius: var(--altimeter-meters-border-radius, 3px);
                    display: none;
                }
                #wrapper[show-meters="true"] #selectedaltmeterscontainer {
                    display: block;
                }
                    #selectedaltmeters {
                        position: absolute;
                        right: 0.25em;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: var(--altimeter-meters-font-size, 0.9em);
                        color: var(--wt-g3x5-lightblue);
                    }
                #indicatedaltmeterscontainer {
                    position: absolute;
                    right: 5%;
                    bottom: calc(50% + var(--altimeter-indicatedalt-font-size, 1.25em) * 1.2 + 1%);
                    width: calc(95% - var(--altimeter-majortick-width, 24%));
                    height: calc(var(--altimeter-meters-font-size, 0.9em) * 1.2);
                    background-color: var(--wt-g3x5-bggray);
                    border-radius: var(--altimeter-meters-border-radius, 3px);
                    display: none;
                }
                #wrapper[show-meters="true"] #indicatedaltmeterscontainer {
                    display: block;
                }
                    #indicatedaltmeters {
                        position: absolute;
                        right: 0.25em;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: var(--altimeter-meters-font-size, 0.9em);
                        color: white;
                    }
                #indicatedaltdisplaycontainer {
                    position: absolute;
                    left: calc(var(--altimeter-minortick-width, 12%) / 2);
                    width: calc(100% - var(--altimeter-minortick-width, 12%) / 2);
                    top: 50%;
                    height: calc(var(--altimeter-indicatedalt-font-size, 1.25em) * 1.2 * 2);
                    transform: translateY(-50%);
                }
                    #indicatedaltdisplaybg {
                        width: 100%;
                        height: 100%;
                        fill: var(--wt-g3x5-bggray);
                        stroke: white;
                        stroke-width: 1px;
                    }
                    #indicatedaltdisplay {
                        position: absolute;
                        left: 12%;
                        top: 0%;
                        width: 81%;
                        height: 100%;
                        font-size: var(--altimeter-indicatedalt-font-size, 1.25em);
                    }
                        .indicatedAltDigitContainer {
                            position: absolute;
                            text-align: center;
                            overflow: hidden;
                        }
                        #indicatedaltdigitcontainer0 {
                            right: 0%;
                            top: 7.5%;
                            width: 35%;
                            height: 85%;
                        }
                        #indicatedaltdigitcontainer1 {
                            right: 37%;
                            top: 27.5%;
                            width: 21%;
                            height: 45%;
                        }
                        #indicatedaltdigitcontainer2 {
                            right: 58%;
                            top: 27.5%;
                            width: 21%;
                            height: 45%;
                        }
                        #indicatedaltdigitcontainer3 {
                            right: 79%;
                            top: 27.5%;
                            width: 21%;
                            height: 45%;
                        }
                            .indicatedAltDigitGroup {
                                position: absolute;
                                left: 0%;
                                top: calc(50% + 0.1em);
                                width: 100%;
                                height: 3em;
                                transform: translateY(-50%);
                                text-anchor: middle;
                                fill: white;
                            }
                                .indicatedAltDigit {
                                    dominant-baseline: central;
                                }
                                    .indicatedAltDigit tspan {
                                        alignment-baseline: baseline;
                                    }
                                .minusDigit {
                                    display: none;
                                }
                                .minusDigit[show="true"] {
                                    display: inherit;
                                }
            #barocontainer {
                position: absolute;
                left: 0%;
                bottom: 0%;
                height: 9.2%;
                width: 100%;
                background-color: var(--wt-g3x5-bggray);
                border-radius: 0 0 var(--altimeter-tape-bg-border-radius, 10px) 0;
            }
                #baro {
                    position: absolute;
                    left: 0%;
                    width: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    text-align: center;
                    color: var(--wt-g3x5-lightblue);
                    font-size: var(--altimeter-baro-font-size, 1em);
                }
                    #barounit {
                        font-size: var(--altimeter-baro-unit-font-size, 0.75em);
                    }

        .${WT_G3000_PFDAltimeterAltitudeHTMLElement.UNIT_CLASS} {
            font-size: var(--altimeter-unit-font-size, 0.75em);
        }
        .${WT_G3000_PFDAltimeterAltitudeHTMLElement.SMALL_DIGIT_CLASS} {
            font-size: var(--altimeter-smalldigit-font-size, 0.85em);
        }
    </style>
    <div id="wrapper">
        <div id="selectedaltcontainer">
            <svg id="selectedalticonsvg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path id="selectedalticon" d="M 100 0 h -100 v 100 h 100 v -25 L 33.33 50 L 100 25 Z" />
            </svg>
            <div id="selectedalt">
                <span id="selectedaltbig"></span><span id="selectedaltsmall" class="${WT_G3000_PFDAltimeterAltitudeHTMLElement.SMALL_DIGIT_CLASS}"></span>
            </div>
        </div>
        <div id="tapecontainer">
            <div id="tapeclip">
                <div id="tape">
                    <svg id="minorticks" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                    <svg id="majorticks" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                    <svg id="labels"></svg>
                </div>
            </div>
            <div id="selectedaltbugclip">
                <div id="selectedaltbugcontainer">
                    <svg id="selectedaltbug" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 100 0 h -100 v 100 h 100 v -25 L 33.33 50 L 100 25 Z" />
                    </svg>
                </div>
            </div>
            <div id="trendcontainer">
                <svg>
                    <rect id="trend" x="0%" y="50%" width="100%" vector-effect="non-scaling-stroke" />
                </svg>
            </div>
            <div id="selectedaltmeterscontainer">
                <div id="selectedaltmeters"></div>
            </div>
            <div id="indicatedaltmeterscontainer">
                <div id="indicatedaltmeters"></div>
            </div>
            <div id="indicatedaltdisplaycontainer">
                <svg id="indicatedaltdisplaybg" viewbox="0 0 100 100" preserveAspectRatio="none">
                    <path vector-effect="non-scaling-stroke" d="M 95 5 L 63 5 L 63 25 L 10 25 L 10 42.5 L 0 50 L 10 57.5 L 10 75 L 63 75 L 63 95 L 95 95 Z" />
                </svg>
                <div id="indicatedaltdisplay">
                    <div id="indicatedaltdigitcontainer0" class="indicatedAltDigitContainer">
                        <svg class="indicatedAltDigitGroup">
                            <text class="indicatedAltDigit topDigit" x="50%" y="16.67%">
                                <tspan class="${WT_G3000_PFDAltimeterAltitudeHTMLElement.SMALL_DIGIT_CLASS}">1</tspan>
                            </text>
                            <text class="indicatedAltDigit middleDigit" x="50%" y="50%">
                                <tspan class="${WT_G3000_PFDAltimeterAltitudeHTMLElement.SMALL_DIGIT_CLASS}">0</tspan>
                            </text>
                            <text class="indicatedAltDigit bottomDigit" x="50%" y="83.33%">
                                <tspan class="${WT_G3000_PFDAltimeterAltitudeHTMLElement.SMALL_DIGIT_CLASS}">9</tspan>
                            </text>
                        </svg>
                    </div>
                    <div id="indicatedaltdigitcontainer1" class="indicatedAltDigitContainer">
                        <svg class="indicatedAltDigitGroup">
                            <text class="indicatedAltDigit topDigit" x="50%" y="16.67%">
                                <tspan>1</tspan>
                            </text>
                            <text class="indicatedAltDigit middleDigit" x="50%" y="50%">
                                <tspan>0</tspan>
                            </text>
                            <text class="indicatedAltDigit bottomDigit" x="50%" y="83.33%">
                                <tspan>9</tspan>
                            </text>
                        </svg>
                    </div>
                    <div id="indicatedaltdigitcontainer2" class="indicatedAltDigitContainer">
                        <svg class="indicatedAltDigitGroup">
                            <text class="indicatedAltDigit topDigit" x="50%" y="16.67%">
                                <tspan>1</tspan>
                            </text>
                            <text class="indicatedAltDigit middleDigit" x="50%" y="50%">
                                <tspan>0</tspan>
                            </text>
                            <text class="indicatedAltDigit bottomDigit" x="50%" y="83.33%">
                                <tspan>9</tspan>
                            </text>
                            <text class="indicatedAltDigit minusDigit" x="50%" y="50%">
                                <tspan>−</tspan>
                            </text>
                        </svg>
                    </div>
                    <div id="indicatedaltdigitcontainer3" class="indicatedAltDigitContainer">
                        <svg class="indicatedAltDigitGroup">
                            <text class="indicatedAltDigit topDigit" x="50%" y="16.67%">
                                <tspan>1</tspan>
                            </text>
                            <text class="indicatedAltDigit middleDigit" x="50%" y="50%">
                                <tspan>0</tspan>
                            </text>
                            <text class="indicatedAltDigit bottomDigit" x="50%" y="83.33%">
                                <tspan>9</tspan>
                            </text>
                            <text class="indicatedAltDigit minusDigit" x="50%" y="50%">
                                <tspan>−</tspan>
                            </text>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
        <div id="barocontainer">
            <div id="baro">
                <span id="baronumber"></span><span id="barounit"></span>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3000_PFDAltimeterAltitudeHTMLElement.NAME, WT_G3000_PFDAltimeterAltitudeHTMLElement);