class WT_MapViewWindDataLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewWindDataLayer.CLASS_DEFAULT, configName = WT_MapViewWindDataLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);
    }

    _createHTMLElement() {
        this._windDisplay = new WT_MapViewWindDataDisplay();
        return this._windDisplay;
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.wind.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._windDisplay.update(state);
    }
}
WT_MapViewWindDataLayer.CLASS_DEFAULT = "windDataLayer";
WT_MapViewWindDataLayer.CONFIG_NAME_DEFAULT = "wind";

class WT_MapViewWindDataDisplay extends HTMLElement {
    constructor() {
        super();

        let template = document.createElement("template");
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: black;
                    border: solid 1px white;
                    border-radius: 3px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 2.5vh;
                    line-height: 2.5vh;
                    color: white;
                    overflow: hidden;
                }
                #data {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    grid-template-rows: 1fr;
                    align-items: center;
                    overflow: hidden;
                }
                    #arrowbox {
                        height: 95%;
                    }
                        #arrow {
                            fill: var(--arrow-color, white);
                        }
                    #windspeed {
                        margin: 0 0.25vh;
                    }
                        .windUnit {
                            font-size: 0.75em;
                        }
                #nodata {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    font-size: 0.75em;
                    line-height: 1em;
                }
            </style>
            <div id="data">
                <svg xmlns="${Avionics.SVG.NS}" id="arrowbox" viewBox="0 0 50 50">
                    <path id="arrow" d="M25 2.5 L10.75 20 L19.75 20 L19.75 47.5 L30.25 47.5 L30.25 20 L39.25 20 Z"></path>
                </svg>
                <div id="windspeed"></div>
            </div>
            <div id="nodata">NO WIND DATA</div>
        `;
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._isNoData = false;
        this._isArrowVisible = true;

        let formatterOpts = {
            precision: 1,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["windNumber"];
                },
                getUnitClassList() {
                    return ["windUnit"];
                }
            }
        };
        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    connectedCallback() {
        this._data = this.shadowRoot.querySelector(`#data`);
        this._arrowbox = this.shadowRoot.querySelector(`#arrowbox`);
        this._arrow = this.shadowRoot.querySelector(`#arrow`);
        this._windSpeedText = this.shadowRoot.querySelector(`#windspeed`);
        this._noData = this.shadowRoot.querySelector(`#nodata`);
    }

    _showArrow(value) {
        if (value !== this._isArrowVisible) {
            this._arrow.style.display = value ? "inherit" : "none";
            this._isArrowVisible = value;
        }
    }

    _setNoData(value) {
        if (value !== this._isNoData) {
            this._data.style.display = value ? "none" : "grid";
            this._noData.style.display = value ? "block" : "none";
            this._isNoData = value;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Number} windDirection
     */
    _rotateArrow(state, windDirection) {
        let rotate = (windDirection + 180 + state.projection.rotation) % 360;
        this._arrow.setAttribute("transform", `rotate(${rotate} 25 25)`);
    }

    /**
     *
     * @param {WT_NumberUnit} windSpeed
     */
    _setSpeedText(windSpeed) {
        this._windSpeedText.innerHTML = this._formatter.getFormattedHTML(windSpeed);
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (state.model.airplane.isOnGround()) {
            this._setNoData(true);
        } else {
            this._setNoData(false);
            let windSpeed = state.model.weather.windSpeed;
            if (windSpeed.asUnit(WT_Unit.KNOT) < 1) {
                this._showArrow(false);
            } else {
                this._showArrow(true);
                this._rotateArrow(state, state.model.weather.windDirection);
            }
            this._setSpeedText(windSpeed);
        }
    }
}
customElements.define("map-view-winddatadisplay", WT_MapViewWindDataDisplay);