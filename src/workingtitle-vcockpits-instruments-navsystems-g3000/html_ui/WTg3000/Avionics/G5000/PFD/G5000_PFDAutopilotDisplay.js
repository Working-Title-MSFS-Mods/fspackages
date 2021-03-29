class WT_G5000_PFDAutopilotDisplay extends WT_G3x5_PFDAutopilotDisplay {
    _createModel() {
        return new WT_G5000_PFDAutopilotDisplayModel(this.instrument.airplane, this.instrument.referenceAltimeter, this.instrument.autoThrottle);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G5000_PFDAutopilotDisplayHTMLElement();
        htmlElement.setContext({
            model: this._model
        });
        return htmlElement;
    }
}

class WT_G5000_PFDAutopilotDisplayModel extends WT_G3x5_PFDAutopilotDisplayModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_AirplaneAltimeter} altimeter
     * @param {WT_G5000_AutoThrottle} autoThrottle
     */
    constructor(airplane, altimeter, autoThrottle) {
        super(airplane);

        this._altimeter = altimeter;
        this._autoThrottle = autoThrottle;
    }

    /**
     * @readonly
     * @type {WT_G5000_AutoThrottle.Mode}
     */
    get autoThrottleMode() {
        return this._autoThrottle.mode;
    }
}

class WT_G5000_PFDAutopilotDisplayHTMLElement extends WT_G3x5_PFDAutopilotDisplayHTMLElement {
    constructor() {
        super();

        this._lastAutoThrottleActive = false;
        this._lastAutoThrottleAlertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.OFF;
    }

    _getTemplate() {
        return WT_G5000_PFDAutopilotDisplayHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._autoThrottleMode = new WT_CachedElement(this.shadowRoot.querySelector(`#autothrottlemode`));
        this._autoThrottleReference = new WT_CachedElement(this.shadowRoot.querySelector(`#autothrottlereference`));

        this._lateralActive = new WT_CachedElement(this.shadowRoot.querySelector(`#lateralactive`));
        this._lateralArmed = new WT_CachedElement(this.shadowRoot.querySelector(`#lateralarmed`));

        this._flightdirector = new WT_CachedElement(this.shadowRoot.querySelector(`#flightdirector`));

        this._verticalActive = new WT_CachedElement(this.shadowRoot.querySelector(`#verticalactive`));
        this._verticalArmedPrimary = new WT_CachedElement(this.shadowRoot.querySelector(`#verticalarmedprimary`));
        this._verticalArmedSecondary = new WT_CachedElement(this.shadowRoot.querySelector(`#verticalarmedsecondary`));
        this._verticalReference = new WT_CachedElement(this.shadowRoot.querySelector(`#verticalreference`));
    }

    _setMasterShow(value) {
        this._wrapper.setAttribute("show-master", `${value}`);
    }

    _setFlightDirectorShow(value) {
        this._wrapper.setAttribute("show-fd", `${value}`);
    }

    _setLateralActiveText(text) {
        this._lateralActive.textContent = text;
    }

    _setLateralArmedText(text) {
        this._lateralArmed.textContent = text;
    }

    _setVerticalActiveText(text) {
        this._verticalActive.textContent = text;
    }

    _setVerticalArmedPrimaryText(text) {
        this._verticalArmedPrimary.textContent = text;
    }

    _setVerticalArmedSecondaryText(text) {
        this._verticalArmedSecondary.textContent = text;
    }

    _setVerticalReferenceHTML(html) {
        this._verticalReference.innerHTML = html;
    }

    _setMasterDisconnectAlertState(state) {
        this._wrapper.setAttribute("masterdisconnect-alert", `${WT_G5000_PFDAutopilotDisplayHTMLElement.DISCONNECT_ALERT_ATTRIBUTES[state]}`);
    }

    _setAltitudeHoldAlert(value) {
        this._wrapper.setAttribute("althold-alert", `${value}`);
    }

    _setAutoThrottleShow(value) {
        this._wrapper.setAttribute("show-autothrottle", `${value}`);
    }

    _setAutoThrottleModeText(text) {
        this._autoThrottleMode.textContent = text;
    }

    _setAutoThrottleReferenceHTML(html) {
        this._autoThrottleReference.innerHTML = html;
    }

    _updateAutoThrottle() {
        let mode = this._context.model.autoThrottleMode;
        this._setAutoThrottleShow(mode !== WT_G5000_AutoThrottle.Mode.OFF);
        this._setAutoThrottleModeText(WT_G5000_PFDAutopilotDisplayHTMLElement.AUTOTHROTTLE_MODE_TEXTS[mode]);
        if (mode === WT_G5000_AutoThrottle.Mode.SPD) {
            if (this._context.model.isSpeedReferenceMach) {
                this._setAutoThrottleReferenceHTML(`M ${this._context.model.referenceMach.toFixed(3).replace(/^0\./, ".")}`);
            } else {
                this._setAutoThrottleReferenceHTML(this._airspeedFormatter.getFormattedHTML(this._context.model.referenceAirspeed));
            }
        } else {
            this._setAutoThrottleReferenceHTML("");
        }
    }

    _setAutoThrottleDisconnectAlertState(state) {
        this._wrapper.setAttribute("autothrottledisconnect-alert", `${WT_G5000_PFDAutopilotDisplayHTMLElement.DISCONNECT_ALERT_ATTRIBUTES[state]}`);
    }

    _updateAutoThrottleDisconnectAlert() {
        let isActive = this._context.model.autoThrottleMode !== WT_G5000_AutoThrottle.Mode.OFF;
        let alertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.OFF;
        if (!isActive && (this._lastAutoThrottleActive || this._lastAutoThrottleAlertState === WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.CAUTION)) {
            alertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.CAUTION;
        }

        this._setAutoThrottleDisconnectAlertState(alertState);
        this._lastAutoThrottleActive = isActive;
        this._lastAutoThrottleAlertState = alertState;
    }

    _updateAlerts() {
        super._updateAlerts();

        this._updateAutoThrottleDisconnectAlert();
    }

    _updateDisplay() {
        super._updateDisplay();

        this._updateAutoThrottle();
    }
}
WT_G5000_PFDAutopilotDisplayHTMLElement.DISCONNECT_ALERT_ATTRIBUTES = [
    "off",
    "caution",
    "warning"
];
WT_G5000_PFDAutopilotDisplayHTMLElement.AUTOTHROTTLE_MODE_TEXTS = [
    "",
    "SPD",
    "CLIMB",
    "DESC"
];
WT_G5000_PFDAutopilotDisplayHTMLElement.NAME = "wt-pfd-autopilotdisplay";
WT_G5000_PFDAutopilotDisplayHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDAutopilotDisplayHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            background-color: var(--wt-g3x5-bggray);
            border-radius: 5px;
        }

        @keyframes alert-flash {
            0% {
                color: black;
                background-color: var(--wt-g3x5-lightgreen);
            }
            50% {
                color: var(--wt-g3x5-lightgreen);
                background-color: transparent;
            }
            100% {
                color: black;
                background-color: var(--wt-g3x5-lightgreen);
            }
        }

        @keyframes alert-caution {
            0% {
                color: black;
                background-color: var(--wt-g3x5-amber);
            }
            50% {
                color: var(--wt-g3x5-amber);
                background-color: transparent;
            }
            100% {
                color: black;
                background-color: var(--wt-g3x5-amber);
            }
        }

        @keyframes alert-warning {
            0% {
                color: white;
                background-color: red;
            }
            50% {
                color: red;
                background-color: transparent;
            }
            100% {
                color: white;
                background-color: red;
            }
        }

        #wrapper {
            position: absolute;
            left: var(--autopilotdisplay-padding-left, 0.1em);
            top: var(--autopilotdisplay-padding-top, 0.1em);
            width: calc(100% - var(--autopilotdisplay-padding-left, 0.1em) - var(--autopilotdisplay-padding-right, 0.1em));
            height: calc(100% - var(--autopilotdisplay-padding-top, 0.1em) - var(--autopilotdisplay-padding-bottom, 0.1em));
        }
            .maincontainer {
                position: absolute;
                top: 0%;
                height: 100%;
            }
            .divider {
                position: absolute;
                top: 5%;
                width: 0%;
                height: 90%;
                border-left: groove 1px black;
            }
            .active {
                line-height: 1em;
                color: var(--wt-g3x5-lightgreen);
            }
            .armed {
                line-height: 1em;
                color: white;
                font-size: var(--autopilotdisplay-armed-font-size, 0.8em);
            }
            #autothrottlecontainer {
                left: 0%;
                width: calc(25% - 1px);
                text-align: left;
                color: var(--wt-g3x5-lightgreen);
            }
                #autothrottlemode {
                    position: absolute;
                    left: 0%;
                    top: 20%;
                    transform: translateY(-0.5em);
                    line-height: 1em;
                }
                #autothrottlereference {
                    position: absolute;
                    left: 0%;
                    top: 80%;
                    transform: translateY(-0.5em);
                    line-height: 1em;
                }
            #divider1 {
                left: 25%;
            }
            #lateralcontainer {
                left: calc(25% + 2px);
                width: calc(15% - 3px);
            }
                #lateralactive {
                    position: absolute;
                    left: 50%;
                    top: 20%;
                    transform: translate(-50%, -0.5em);
                }
                #lateralarmed {
                    position: absolute;
                    left: 50%;
                    top: 80%;
                    transform: translate(-50%, -0.5em);
                }
            #divider2 {
                left: 40%;
            }
            #centercontainer {
                left: calc(40% + 2px);
                width: calc(17.5% - 3px);
                color: transparent;
            }
                #master {
                    position: absolute;
                    left: 25%;
                    top: 20%;
                    transform: translate(-50%, -0.5em);
                    line-height: 1em;
                }
                #wrapper[show-master="true"] #master {
                    color: var(--wt-g3x5-lightgreen);
                }
                #wrapper[masterdisconnect-alert="caution"] #master {
                    animation: alert-caution 1s step-end 5;
                }
                #wrapper[masterdisconnect-alert="warning"] #master {
                    /*
                     * Longitude AP disconnect button does not send the correct event to JS, so we will limit warning
                     * to 5 seconds so as to not have an un-acknowledgeable warning flashing forever.
                     */
                    animation: alert-warning 1s step-end 5;
                }
                #flightdirector {
                    position: absolute;
                    left: 0%;
                    top: 37.5%;
                    width: 100%;
                    height: 25%;
                    fill: var(--wt-g3x5-lightgreen);
                    display: none;
                }
                #wrapper[show-fd="true"] #flightdirector {
                    display: block;
                }
                #autothrottle {
                    position: absolute;
                    left: 50%;
                    top: 80%;
                    transform: translate(-50%, -0.5em);
                    line-height: 1em;
                }
                #wrapper[show-autothrottle="true"] #autothrottle {
                    color: var(--wt-g3x5-lightgreen);
                }
                #wrapper[autothrottledisconnect-alert="caution"] #autothrottle {
                    animation: alert-caution 1s step-end 5;
                }
            #divider3 {
                left: 57.5%;
            }
            #verticalcontainer {
                left: calc(57.5% + 2px);
                width: calc(42.5% - 2px);
            }
                #verticalactive {
                    position: absolute;
                    left: 25%;
                    top: 20%;
                    transform: translate(-50%, -0.5em);
                }
                #wrapper[althold-alert="true"] #verticalactive {
                    animation: alert-flash 1s step-end 10;
                }
                #verticalarmedprimary {
                    position: absolute;
                    left: 25%;
                    top: 80%;
                    transform: translate(-50%, -0.5em);
                }
                #verticalarmedsecondary {
                    position: absolute;
                    left: 75%;
                    top: 80%;
                    transform: translate(-50%, -0.5em);
                }
                #verticalreference {
                    position: absolute;
                    right: 0%;
                    top: 20%;
                    width: 50%;
                    transform: translateY(-0.5em);
                    text-align: right;
                    line-height: 1em;
                    color: var(--wt-g3x5-lightgreen);
                }

        .${WT_G3x5_PFDAutopilotDisplayHTMLElement.UNIT_CLASS} {
            font-size: var(--autopilotdisplay-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="autothrottlecontainer" class="maincontainer">
            <div id="autothrottlemode"></div>
            <div id="autothrottlereference"></div>
        </div>
        <div id="divider1" class="divider"></div>
        <div id="lateralcontainer" class="maincontainer">
            <div id="lateralactive" class="active"></div>
            <div id="lateralarmed" class="armed"></div>
        </div>
        <div id="divider2" class="divider"></div>
        <div id="centercontainer" class="maincontainer">
            <svg id="flightdirector" viewbox="0 0 250 50">
                <path d="M 5 25 L 25 5 L 25 22.5 L 245 22.5 L 245 27.5 L 25 27.5 L 25 45 Z" />
            </svg>
            <div id="master">AP</div>
            <div id="autothrottle">AT</div>
        </div>
        <div id="divider3" class="divider"></div>
        <div id="verticalcontainer" class="maincontainer">
            <div id="verticalactive" class="active"></div>
            <div id="verticalarmedprimary" class="armed"></div>
            <div id="verticalarmedsecondary" class="armed"></div>
            <div id="verticalreference"></div>
        </div>
    </div>
`;

customElements.define(WT_G5000_PFDAutopilotDisplayHTMLElement.NAME, WT_G5000_PFDAutopilotDisplayHTMLElement);