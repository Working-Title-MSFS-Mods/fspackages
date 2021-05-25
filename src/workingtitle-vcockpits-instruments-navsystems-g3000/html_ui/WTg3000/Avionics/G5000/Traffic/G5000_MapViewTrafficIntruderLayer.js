class WT_G5000_MapViewTrafficIntruderLayer extends WT_G3x5_MapViewTrafficIntruderLayer {
    _createOffScaleHTMLElement() {
        return new WT_G5000_MapViewTrafficOffScaleHTMLElement();
    }

    _createIntruderViewHTMLElementRecycler() {
        return new WT_G5000_MapViewTrafficIntruderViewHTMLElementRecycler(this._iconLayer.container);
    }

    _createIntruderView(intruderEntry) {
        return new WT_G5000_MapViewTrafficIntruderView(intruderEntry, this._intruderViewHTMLElementRecycler);
    }

    /**
     *
     * @param {WT_G5000_MapViewTrafficIntruderView} view
     * @param {Boolean} showSymbol
     * @param {Boolean} showLabel
     */
    _updateIntruderView(state, view, showSymbol, showLabel) {
        super._updateIntruderView(state, view, showSymbol, showLabel);


        if (view.isOffScale) {
            switch (view.intruderEntry.alertLevel) {
                case WT_G5000_TCASII.AlertLevel.RESOLUTION_ADVISORY:
                    this._raOffScaleCount++;
                    break;
                case WT_G5000_TCASII.AlertLevel.TRAFFIC_ADVISORY:
                    this._taOffScaleCount++;
                    break;
            }
        }
    }

    _updateIntruders(state) {
        this._raOffScaleCount = 0;
        this._taOffScaleCount = 0;

        super._updateIntruders(state);
    }

    _updateOffScale(state) {
        this._offScaleHTMLElement.update(state, this._raOffScaleCount, this._taOffScaleCount);
    }
}

class WT_G5000_MapViewTrafficIntruderViewHTMLElementRecycler extends WT_HTMLElementRecycler {
    /**
     *
     * @returns {T}
     */
    _createElement() {
        return new WT_G5000_MapViewTrafficIntruderHTMLElement();
    }
}

class WT_G5000_MapViewTrafficIntruderView extends WT_G3x5_MapViewTrafficIntruderView {
    /**
     *
     * @param {WT_MapViewState} state
     * @param {Boolean} useOuterRangeMaxScale
     */
    _updateVisibility(state, useOuterRangeMaxScale, showSymbol) {
        let isVisible = false;
        if (showSymbol) {
            if (this.intruderEntry.alertLevel === WT_G5000_TCASII.AlertLevel.RESOLUTION_ADVISORY || this.intruderEntry.alertLevel === WT_G5000_TCASII.AlertLevel.TRAFFIC_ADVISORY) {
                isVisible = useOuterRangeMaxScale || !this.isOffScale;
            } else {
                let altitudeMeters = this.intruderEntry.intruder.relativePositionVector.z;
                let isWithinAltitude = altitudeMeters <= state.model.traffic.altitudeRestrictionAbove.asUnit(WT_Unit.METER) && altitudeMeters >= -state.model.traffic.altitudeRestrictionBelow.asUnit(WT_Unit.METER);
                isVisible = !this.isOffScale && isWithinAltitude;
            }
        }
        this._isVisible = isVisible;
    }
}

class WT_G5000_MapViewTrafficIntruderHTMLElement extends WT_G3x5_MapViewTrafficIntruderHTMLElement {
    constructor() {
        super();

        this._zIndex = null;
    }

    _getTemplate() {
        return WT_G5000_MapViewTrafficIntruderHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._taHalfCircle = new WT_CachedElement(this.shadowRoot.querySelector(`#tahalfcircle`));
        this._iconArrow = new WT_CachedElement(this.shadowRoot.querySelector(`#iconarrow`));
        this._altAbove = new WT_CachedElement(this.shadowRoot.querySelector(`#altabove`));
        this._altBelow = new WT_CachedElement(this.shadowRoot.querySelector(`#altbelow`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    _computeSize(iconSize) {
        return iconSize * 3;
    }

    _updateVisibility(state, isVisible) {
        this._wrapper.setAttribute("show", `${isVisible}`);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_G5000_TCASII.AlertLevel} level
     */
    _setAlertLevel(state, level) {
        this._wrapper.setAttribute("alert", WT_G5000_MapViewTrafficIntruderHTMLElement.ALERT_ATTRIBUTES[level]);
        if (this._zIndex !== level) {
            this.style.zIndex = level;
            this._zIndex = level;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Boolean} value
     */
    _setOffScale(state, value) {
        this._wrapper.setAttribute("offscale", `${value}`);
        if (value && this.intruderView.intruderEntry.alertLevel === WT_G5000_TCASII.AlertLevel.TRAFFIC_ADVISORY) {
            let angle = this._tempVector2.set(this.intruderView.viewPosition).subtract(state.viewPlane).theta * Avionics.Utils.RAD2DEG;
            this._taHalfCircle.setAttribute("transform", `rotate(${angle})`);
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Number} track
     */
    _setGroundTrack(state, track) {
        let angle = track + state.projection.rotation;
        this._iconArrow.setAttribute("style", `transform: rotate(${angle}deg);`);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Boolean} isRelative
     * @param {Number} feet
     * @param {Boolean} isAbove
     */
    _setAltitudeDisplay(state, isRelative, feet, isAbove) {
        let feetRounded = Math.round(feet / 100);
        let feetAbs = Math.abs(feetRounded);
        let prefix = "";
        if (isRelative) {
            prefix = isAbove ? "+" : "−";
        }

        if (isAbove) {
            this._wrapper.setAttribute("alt", "above");
            this._altAbove.textContent = `${prefix}${feetAbs}`;
        } else {
            this._wrapper.setAttribute("alt", "below");
            this._altBelow.textContent = `${prefix}${feetAbs}`;
        }

    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Number} fpm
     */
    _setVerticalSpeed(state, fpm) {
        if (fpm >= WT_G5000_MapViewTrafficIntruderHTMLElement.VERTICAL_SPEED_THRESHOLD) {
            this._wrapper.setAttribute("vs", "positive");
        } else if (fpm <= -WT_G5000_MapViewTrafficIntruderHTMLElement.VERTICAL_SPEED_THRESHOLD) {
            this._wrapper.setAttribute("vs", "negative");
        } else {
            this._wrapper.setAttribute("vs", "none");
        }
    }

    _setLabelVisibility(value) {
        this._wrapper.setAttribute("show-label", `${value}`);
    }
}
WT_G5000_MapViewTrafficIntruderHTMLElement.VERTICAL_SPEED_THRESHOLD = 500; // FPM
WT_G5000_MapViewTrafficIntruderHTMLElement.ALERT_ATTRIBUTES = [
    "unknown",
    "nonthreat",
    "pa",
    "ta",
    "ra"
];
WT_G5000_MapViewTrafficIntruderHTMLElement.NAME = "wt-map-view-traffic-intruder";
WT_G5000_MapViewTrafficIntruderHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_MapViewTrafficIntruderHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: none;
        }
        #wrapper[show="true"] {
            display: block;
        }
            .label {
                display: none;
            }
            #wrapper[show-label="true"] .label {
                display: block;
            }

            #wrapper[show-label="true"] .alt {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                display: none;
                color: white;
                background-color: black;
            }
            #wrapper[alert="ta"] .alt {
                color: var(--wt-g3x5-amber);
            }
            #altabove {
                bottom: 63%;
            }
            #wrapper[show-label="true"][alt="above"] #altabove {
                display: block;
            }
            #altbelow {
                top: 63%;
            }
            #wrapper[show-label="true"][alt="below"] #altbelow {
                display: block;
            }
            .icon {
                position: absolute;
                left: 33.3%;
                top: 33.3%;
                width: 33.3%;
                height: 33.3%;
            }
                #iconbackground {
                    display: none;
                }
                #wrapper[alert="ta"] #iconbackground {
                    display: block;
                }
                    #tacircle {
                        fill: var(--wt-g3x5-amber);
                        stroke-width: 3;
                        stroke: var(--wt-g3x5-bggray);
                    }
                    #tahalfcircle {
                        fill: black;
                        display: none;
                    }
                    #wrapper[offscale="true"] #tahalfcircle {
                        display: inherit;
                    }

                    #iconarrowbackground {
                        transform: scale(1.4);
                        fill: black;
                    }
                    #wrapper[alert="ta"] #iconarrowbackground {
                        fill: var(--wt-g3x5-amber);
                    }
                    #iconarrowoutline {
                        fill: black;
                        stroke-width: 5;
                        stroke: white;
                    }
                    #wrapper[alert="pa"] #iconarrowoutline {
                        fill: white;
                        stroke: transparent;
                    }
                    #wrapper[alert="ta"] #iconarrowoutline {
                        fill: var(--wt-g3x5-amber);
                        stroke: black;
                    }
            #vsarrow {
                position: absolute;
                left: 66.6%;
                top: 40%;
                width: 20%;
                height: 20%;
                stroke-width: 10;
                stroke: white;
            }
                #wrapper[vs="none"] #vsarrow {
                    display: none;
                }
                #wrapper[vs="negative"] #vsarrow {
                    transform: rotate(180deg);
                }
                #wrapper[alert="ta"] #vsarrow {
                    stroke: var(--wt-g3x5-amber);
                }
    </style>
    <div id="wrapper">
        <div id="altabove" class="label alt"></div>
        <div id="altbelow" class="label alt"></div>
        <svg id="iconbackground" class="icon" viewBox="-50 -50 100 100">
            <circle id="tacircle" cx="0" cy="0" r="45" />
            <path id="tahalfcircle" d="M -45 0 L 45 0 A 45 45 0 0 0 -45 0" />
        </svg>
        <svg id="iconarrow" class="icon" viewBox="-50 -50 100 100">
            <path id="iconarrowbackground" d="M 0 -30 L 21.2 21.2 L 0 10 L -21.2 21.2 Z" />
            <path id="iconarrowoutline" d="M 0 -30 L 21.2 21.2 L 0 10 L -21.2 21.2 Z" />
        </svg>
        <svg id="vsarrow" viewBox="0 0 100 100">
            <path d="M 50 10 L 50 90 M 20 40 L 50 5 L 80 40" />
        </svg>

    </div>
`;

customElements.define(WT_G5000_MapViewTrafficIntruderHTMLElement.NAME, WT_G5000_MapViewTrafficIntruderHTMLElement);

class WT_G5000_MapViewTrafficOffScaleHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G5000_MapViewTrafficOffScaleHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    _updateRAOffScale(state, raOffScaleCount) {
        this._wrapper.setAttribute("show-raoffscale", `${raOffScaleCount > 0}`);
    }

    _updateTAOffScale(state, taOffScaleCount) {
        this._wrapper.setAttribute("show-taoffscale", `${taOffScaleCount > 0}`);
    }

    /**
     * @param {WT_MapViewState} state
     * @param {Number} raOffScaleCount
     * @param {Number} taOffScaleCount
     */
    _updateDisplay(state, raOffScaleCount, taOffScaleCount) {
        this._updateRAOffScale(state, raOffScaleCount);
        this._updateTAOffScale(state, taOffScaleCount);
    }

    /**
     * @param {WT_MapViewState} state
     * @param {Number} raOffScaleCount
     * @param {Number} taOffScaleCount
     */
    update(state, raOffScaleCount, taOffScaleCount) {
        if (!this._isInit) {
            return;
        }

        this._updateDisplay(state, raOffScaleCount, taOffScaleCount);
    }
}
WT_G5000_MapViewTrafficOffScaleHTMLElement.NAME = "wt-map-view-traffic-offscale";
WT_G5000_MapViewTrafficOffScaleHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_MapViewTrafficOffScaleHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            text-align: center;
        }
            .banner {
                background-color: black;
                border: solid 1px white;
                border-radius: 3px;
                padding: var(--traffic-offscale-banner-padding, 0 0.2em);
                display: none;
            }
            #raoffscale {
                color: red;
            }
            #wrapper[show-raoffscale="true"] #raoffscale {
                display: block;
            }
            #taoffscale {
                color: var(--wt-g3x5-amber);
            }
            #wrapper[show-taoffscale="true"] #taoffscale {
                display: block;
            }
    </style>
    <div id="wrapper">
        <div id="raoffscale" class="banner">RA OFF SCALE</div>
        <div id="taoffscale" class="banner">TA OFF SCALE</div>
    </div>
`;

customElements.define(WT_G5000_MapViewTrafficOffScaleHTMLElement.NAME, WT_G5000_MapViewTrafficOffScaleHTMLElement);