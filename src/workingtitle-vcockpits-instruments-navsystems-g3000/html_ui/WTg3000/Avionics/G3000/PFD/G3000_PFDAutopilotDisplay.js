class WT_G3000_PFDAutopilotDisplay extends WT_G3x5_PFDAutopilotDisplay {
    _createModel() {
        return new WT_G3000_PFDAutopilotDisplayModel(this.instrument.airplane);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDAutopilotDisplayHTMLElement();
        htmlElement.setContext({
            model: this._model
        });
        return htmlElement;
    }
}

class WT_G3000_PFDAutopilotDisplayModel extends WT_G3x5_PFDAutopilotDisplayModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        super(airplane);

        this._isYawDamperActive = false;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isYawDamperActive() {
        return this._isYawDamperActive;
    }

    _updateYawDamper() {
        this._isYawDamperActive = this._autopilot.isYawDamperActive();
    }

    update() {
        super.update();

        this._updateYawDamper();
    }
}

class WT_G3000_PFDAutopilotDisplayHTMLElement extends WT_G3x5_PFDAutopilotDisplayHTMLElement {
    constructor() {
        super();

        this._lastYawDamperActive = false;
        this._lastYawDamperAlertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.OFF;
    }

    _getTemplate() {
        return WT_G3000_PFDAutopilotDisplayHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

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
        this._wrapper.setAttribute("masterdisconnect-alert", `${WT_G3000_PFDAutopilotDisplayHTMLElement.DISCONNECT_ALERT_ATTRIBUTES[state]}`);
    }

    _setAltitudeHoldAlert(value) {
        this._wrapper.setAttribute("althold-alert", `${value}`);
    }

    _setYawDamperShow(value) {
        this._wrapper.setAttribute("show-yawdamper", `${value}`);
    }

    _updateYawDamper() {
        this._setYawDamperShow(this._context.model.isYawDamperActive);
    }

    _setYawDamperDisconnectAlertState(state) {
        this._wrapper.setAttribute("yawdamperdisconnect-alert", `${WT_G3000_PFDAutopilotDisplayHTMLElement.DISCONNECT_ALERT_ATTRIBUTES[state]}`);
    }

    _updateYawDamperDisconnectAlert() {
        let isActive = this._context.model.isYawDamperActive;
        let alertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.OFF;
        if (!isActive && (this._lastYawDamperActive || this._lastYawDamperAlertState === WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.CAUTION)) {
            alertState = WT_G3x5_PFDAutopilotDisplayHTMLElement.DisconnectAlertState.CAUTION;
        }

        this._setYawDamperDisconnectAlertState(alertState);
        this._lastYawDamperActive = isActive;
        this._lastYawDamperAlertState = alertState;
    }

    _updateAlerts() {
        super._updateAlerts();

        this._updateYawDamperDisconnectAlert();
    }

    _updateDisplay() {
        super._updateDisplay();

        this._updateYawDamper();
    }
}
WT_G3000_PFDAutopilotDisplayHTMLElement.DISCONNECT_ALERT_ATTRIBUTES = [
    "off",
    "caution",
    "warning"
];
WT_G3000_PFDAutopilotDisplayHTMLElement.NAME = "wt-pfd-autopilotdisplay";
WT_G3000_PFDAutopilotDisplayHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDAutopilotDisplayHTMLElement.TEMPLATE.innerHTML = `
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
            #lateralcontainer {
                left: 0%;
                width: calc(20% - 1px);
            }
                #lateralactive {
                    position: absolute;
                    left: 50%;
                    top: 25%;
                    transform: translate(-50%, -0.5em);
                }
                #lateralarmed {
                    position: absolute;
                    left: 50%;
                    top: 75%;
                    transform: translate(-50%, -0.5em);
                }
            #divider1 {
                left: 20%;
            }
            #centercontainer {
                left: calc(20% + 2px);
                width: calc(25% - 3px);
                color: transparent;
            }
                #master {
                    position: absolute;
                    left: 25%;
                    top: 25%;
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
                    animation: alert-warning 1s step-end Infinite;
                }
                #yawdamper {
                    position: absolute;
                    left: 75%;
                    top: 25%;
                    transform: translate(-50%, -0.5em);
                    line-height: 1em;
                }
                #wrapper[show-yawdamper="true"] #yawdamper {
                    color: var(--wt-g3x5-lightgreen);
                }
                #wrapper[yawdamperdisconnect-alert="caution"] #yawdamper {
                    animation: alert-caution 1s step-end 5;
                }
                #flightdirector {
                    position: absolute;
                    left: 0%;
                    top: 55%;
                    width: 100%;
                    height: 40%;
                    fill: var(--wt-g3x5-lightgreen);
                    display: none;
                }
                #wrapper[show-fd="true"] #flightdirector {
                    display: block;
                }
            #divider2 {
                left: 45%;
            }
            #verticalcontainer {
                left: calc(45% + 2px);
                width: calc(55% - 2px);
            }
                #verticalactive {
                    position: absolute;
                    left: 25%;
                    top: 25%;
                    transform: translate(-50%, -0.5em);
                }
                #wrapper[althold-alert="true"] #verticalactive {
                    animation: alert-flash 1s step-end 10;
                }
                #verticalarmedprimary {
                    position: absolute;
                    left: 25%;
                    top: 75%;
                    transform: translate(-50%, -0.5em);
                }
                #verticalarmedsecondary {
                    position: absolute;
                    left: 75%;
                    top: 75%;
                    transform: translate(-50%, -0.5em);
                }
                #verticalreference {
                    position: absolute;
                    right: 0%;
                    top: 25%;
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
        <div id="lateralcontainer" class="maincontainer">
            <div id="lateralactive" class="active"></div>
            <div id="lateralarmed" class="armed"></div>
        </div>
        <div id="divider1" class="divider"></div>
        <div id="centercontainer" class="maincontainer">
            <div id="master">AP</div>
            <div id="yawdamper">YD</div>
            <svg id="flightdirector" viewbox="0 0 100 50">
                <path d="M 5 25 L 25 5 L 25 22.5 L 95 22.5 L 95 27.5 L 25 27.5 L 25 45 Z" />
            </svg>
        </div>
        <div id="divider2" class="divider"></div>
        <div id="verticalcontainer" class="maincontainer">
            <div id="verticalactive" class="active"></div>
            <div id="verticalarmedprimary" class="armed"></div>
            <div id="verticalarmedsecondary" class="armed"></div>
            <div id="verticalreference"></div>
        </div>
    </div>
`;

customElements.define(WT_G3000_PFDAutopilotDisplayHTMLElement.NAME, WT_G3000_PFDAutopilotDisplayHTMLElement);