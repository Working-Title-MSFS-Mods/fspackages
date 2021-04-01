class WT_G3000_MapViewTrafficIntruderLayer extends WT_G3x5_MapViewTrafficIntruderLayer {
    _createIntruderViewHTMLElementRecycler() {
        return new WT_G3000_MapViewTrafficIntruderViewHTMLElementRecycler(this._iconLayer.container);
    }
}

class WT_G3000_MapViewTrafficIntruderViewHTMLElementRecycler extends WT_HTMLElementRecycler {
    /**
     *
     * @returns {T}
     */
     _createElement() {
        return new WT_G3000_MapViewTrafficIntruderHTMLElement();
    }
}

class WT_G3000_MapViewTrafficIntruderHTMLElement extends WT_G3x5_MapViewTrafficIntruderHTMLElement {
    _getTemplate() {
        return WT_G3000_MapViewTrafficIntruderHTMLElement.TEMPLATE;
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

    _updateVisibility(state) {
        this._isVisible = !this.intruderView.isOffScale || this.intruderView.intruderEntry.alertLevel === WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY;
        this._wrapper.setAttribute("show", `${this._isVisible}`);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_G3000_TrafficAdvisorySystem.AlertLevel} level
     */
    _setAlertLevel(state, level) {
        this._wrapper.setAttribute("alert", WT_G3000_MapViewTrafficIntruderHTMLElement.ALERT_ATTRIBUTES[level]);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Boolean} value
     */
    _setOffScale(state, value) {
        this._wrapper.setAttribute("offscale", `${value}`);
        if (value && this.intruderView.intruderEntry.alertLevel === WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY) {
            let angle = this._tempVector2.set(this.intruderView.viewPosition).subtract(state.viewPlane).theta;
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
     * @param {Number} feet
     */
    _setAltitudeDelta(state, feet) {
        let feetRounded = Math.round(feet / 100);
        if (feetRounded >= 0) {
            this._wrapper.setAttribute("alt", "above");
            this._altAbove.textContent = `+${feetRounded}`;
        } else {
            this._wrapper.setAttribute("alt", "below");
            this._altBelow.textContent = `−${-feetRounded}`;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Number} fpm
     */
    _setVerticalSpeed(state, fpm) {
        if (fpm >= WT_G3000_MapViewTrafficIntruderHTMLElement.VERTICAL_SPEED_THRESHOLD) {
            this._wrapper.setAttribute("vs", "positive");
        } else if (fpm <= -WT_G3000_MapViewTrafficIntruderHTMLElement.VERTICAL_SPEED_THRESHOLD) {
            this._wrapper.setAttribute("vs", "negative");
        } else {
            this._wrapper.setAttribute("vs", "none");
        }
    }
}
WT_G3000_MapViewTrafficIntruderHTMLElement.VERTICAL_SPEED_THRESHOLD = 500; // FPM
WT_G3000_MapViewTrafficIntruderHTMLElement.ALERT_ATTRIBUTES = [
    "unknown",
    "nonthreat",
    "pa",
    "ta"
];
WT_G3000_MapViewTrafficIntruderHTMLElement.NAME = "wt-map-view-traffic-intruder";
WT_G3000_MapViewTrafficIntruderHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_MapViewTrafficIntruderHTMLElement.TEMPLATE.innerHTML = `
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
            .alt {
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
            #wrapper[alt="above"] #altabove {
                display: block;
            }
            #altbelow {
                top: 63%;
            }
            #wrapper[alt="below"] #altbelow {
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
        <div id="altabove" class="alt"></div>
        <div id="altbelow" class="alt"></div>
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

customElements.define(WT_G3000_MapViewTrafficIntruderHTMLElement.NAME, WT_G3000_MapViewTrafficIntruderHTMLElement);